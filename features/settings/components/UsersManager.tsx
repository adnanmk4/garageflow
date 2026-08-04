"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UserRow {
  _id: string;
  name: string;
  phone: string;
  role: "owner" | "employee";
  isActive: boolean;
}

export function UsersManager() {
  const t = useTranslations("settings.users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadUsers() {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function addUser() {
    setError(null);
    setIsAdding(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, role: "employee" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("addError"));
        return;
      }
      setName("");
      setPhone("");
      setPassword("");
      loadUsers();
    } catch {
      setError(t("addError"));
    } finally {
      setIsAdding(false);
    }
  }

  async function toggleActive(user: UserRow) {
    await fetch(`/api/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    loadUsers();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <p className="text-sm font-medium text-muted-foreground">{t("addUser")}</p>
          <div className="flex flex-col gap-1.5">
            <Label>{t("name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("phone")}</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("password")}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="button" onClick={addUser} disabled={isAdding}>
            {isAdding ? t("adding") : t("addButton")}
          </Button>
        </CardContent>
      </Card>

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">{t("existingUsers")}</p>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <Card key={user._id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.phone} · {user.role === "owner" ? t("roleOwner") : t("roleEmployee")}
                    </p>
                  </div>
                  {user.role !== "owner" && (
                    <Button
                      type="button"
                      size="sm"
                      variant={user.isActive ? "outline" : "default"}
                      onClick={() => toggleActive(user)}
                    >
                      {user.isActive ? t("deactivate") : t("activate")}
                    </Button>
                  )}
                  {user.role === "owner" && (
                    <span className={cn("text-xs font-medium text-success")}>{t("active")}</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
