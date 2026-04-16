import { useAuth } from "@/core/auth/hooks";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";

export interface AccountPageProps {}

export const AccountPage = ({}: AccountPageProps) => {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-[640px] p-6">
      <div className="flex flex-col gap-4">
        <h5 className="text-xl font-semibold">Account Info</h5>
        <div className="flex flex-row gap-4 [&>*]:flex-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={user?.fullName ?? ""} disabled />
          </div>
        </div>
      </div>
    </div>
  );
};
