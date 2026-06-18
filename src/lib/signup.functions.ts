import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  role: z.enum(["employee", "employer", "provider"]),
});

export const signUpConfirmed = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        role: data.role,
      },
    });
    if (error) {
      throw new Error(error.message);
    }
    return { userId: created.user?.id ?? null };
  });
