"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/shared/ui-components/controls/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/shared/ui-components/controls/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/ui-components/controls/select";
import type { Campus } from "@/features/school/api/school";
import { PROGRAMS } from "../students.definitions";
import { useCreateStudents } from "../hooks/useStudents";

const dateField = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Pick a valid date");

const schema = z.object({
  firstName: z.string().trim().min(1, "Required").max(100),
  lastName: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().max(40),
  program: z.enum(["AP_MECHANIC", "AIRFRAME", "POWERPLANT", "DISPATCHER"], { message: "Choose a program" }),
  campusId: z.string(),
  startDate: dateField,
  graduationDate: dateField,
});
type Values = z.infer<typeof schema>;

const NONE = "none";

export function AddStudentDialog({
  schoolId, userId, campuses,
}: { schoolId?: string; userId?: string; campuses: Campus[] }) {
  const [open, setOpen] = useState(false);
  const create = useCreateStudents(schoolId, userId);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "",
      program: undefined as unknown as Values["program"],
      campusId: campuses.length === 1 ? campuses[0].id : NONE,
      startDate: "", graduationDate: "",
    },
  });

  const onSubmit = async (v: Values) => {
    try {
      const res = await create.mutateAsync({
        rows: [{
          firstName: v.firstName, lastName: v.lastName, email: v.email,
          phone: v.phone || undefined, program: v.program,
          campusId: v.campusId === NONE ? null : v.campusId,
          startDate: v.startDate || null, graduationDate: v.graduationDate || null,
        }],
      });
      if (res.inserted === 0) {
        form.setError("email", { message: "A student with this email is already enrolled" });
        return;
      }
      toast.success(`${v.firstName} ${v.lastName} added`);
      form.reset();
      setOpen(false);
    } catch {
      toast.error("Could not add the student. Please try again.");
    }
  };

  const text = (name: "firstName" | "lastName" | "email" | "phone", label: string, type = "text") => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input type={type} {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" />Add Student</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>Enroll one student. To add many at once, use Import CSV.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {text("firstName", "First name")}
              {text("lastName", "Last name")}
            </div>
            {text("email", "Email", "email")}
            {text("phone", "Phone (optional)", "tel")}
            <FormField control={form.control} name="program" render={({ field }) => (
              <FormItem>
                <FormLabel>Program</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Choose a program" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {PROGRAMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {campuses.length > 1 && (
              <FormField control={form.control} name="campusId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Campus</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>No campus</SelectItem>
                      {campuses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem><FormLabel>Start date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="graduationDate" render={({ field }) => (
                <FormItem><FormLabel>Expected graduation</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-[#1E3A5F]" disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add student
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
