import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UserPlus,
  Edit,
  Trash,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";
import { User as UserType } from "@shared/schema";

/* ------------------------
   Zod schemas + types
   ------------------------ */

const baseUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["user", "agent", "admin"]).default("user"),
});

const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const editUserSchema = baseUserSchema.extend({
  // optional for edit (user may not change password)
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type CreateUserValues = z.infer<typeof createUserSchema>;
type EditUserValues = z.infer<typeof editUserSchema>;

/* ------------------------
   Component
   ------------------------ */

export default function UsersPage(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  // handle responsive without SSR window errors
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // forms: separate forms for create vs edit to handle different validations
  const addForm = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: "user",
    },
  });

  const editForm = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      password: undefined,
      name: "",
      email: "",
      role: "user",
    },
  });

  /* ------------------------
     Fetch users
     ------------------------ */
  const {
    data: users,
    isLoading: isLoadingUsers,
    isError: isUsersError,
    error: usersError,
  } = useQuery<UserType[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to fetch users");
      }
      return await res.json();
    },
    enabled: !!user && user.role === "admin", // only for admin
  });

  /* ------------------------
     Mutations
     ------------------------ */

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to create user");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User created", description: "The user was created successfully." });
      setShowAddUserDialog(false);
      addForm.reset();
    },
    onError: (err: any) => {
      toast({
        title: "Create failed",
        description: err?.message || "An error occurred while creating user.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (payload: { id: string | number; data: EditUserValues }) => {
      const { id, data } = payload;
      // remove undefined password if not provided
      const body = { ...data } as Record<string, any>;
      if (!body.password) delete body.password;
      const res = await apiRequest("PUT", `/api/users/${String(id)}`, body);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to update user");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated", description: "User details updated successfully." });
      setShowEditDialog(false);
      setEditingUser(null);
      editForm.reset();
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err?.message || "An error occurred while updating user.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await apiRequest("DELETE", `/api/users/${String(id)}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to delete user");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User deleted", description: "User removed successfully." });
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    },
    onError: (err: any) => {
      toast({
        title: "Delete failed",
        description: err?.message || "An error occurred while deleting user.",
        variant: "destructive",
      });
    },
  });

  /* ------------------------
     UI helpers
     ------------------------ */

  const filteredUsers = users?.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (d?: string) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "agent":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /* ------------------------
     Handlers
     ------------------------ */

  const openEditFor = (u: UserType) => {
    setEditingUser(u);
    // reset edit form values
    editForm.reset({
      username: u.username,
      password: undefined,
      name: u.name,
      email: u.email,
      role: (u.role as "user" | "agent" | "admin") || "user",
    });
    setShowEditDialog(true);
  };

  const openDeleteFor = (u: UserType) => {
    setUserToDelete(u);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen((s) => !s)} title="User Management" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-semibold text-gray-800">Users</h2>
              <p className="text-sm text-gray-500">Manage system users and their permissions</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative w-full sm:w-auto">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              {/* Add user dialog */}
              <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create User</DialogTitle>
                    <DialogDescription>Create a new user with role-based access</DialogDescription>
                  </DialogHeader>

                  <Form {...addForm}>
                    <form
                      onSubmit={addForm.handleSubmit((data) => createUserMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={addForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="agent">Agent</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowAddUserDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createUserMutation.isPending}>
                          {createUserMutation.isPending ? "Creating..." : "Create User"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Users list */}
          <Card>
            {isLoadingUsers ? (
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, idx) => (
                    <Skeleton key={idx} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers!.map((u) => (
                      <tr key={String(u.id)} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{u.name}</div>
                              <div className="text-sm text-gray-500">{u.username}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{u.email}</div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={getRoleBadgeColor(u.role)}>
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </Badge>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate((u as any).createdAt)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => openEditFor(u)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => openDeleteFor(u)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery ? "Try adjusting your search query" : "There are no users in the system yet"}
                </p>
                <Button onClick={() => setShowAddUserDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Role explanation */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
                  User Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Regular users can create tickets, track status, comment, and use the knowledge base & chatbot.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-blue-600" />
                  Agent Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Support agents can resolve tickets, comment, update status, and manage assigned tickets.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-red-600" />
                  Admin Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Administrators have full access to manage users, assign roles, configure settings, and view all tickets.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user details and role</DialogDescription>
              </DialogHeader>

              <Form {...editForm}>
                <form
                  onSubmit={editForm.handleSubmit((data) => {
                    if (!editingUser) return;
                    updateUserMutation.mutate({ id: editingUser.id, data });
                  })}
                  className="space-y-4"
                >
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password (optional)</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>Leave blank if you don't want to change the password</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Delete confirm */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </DialogHeader>

              <DialogDescription>
                Are you sure you want to delete user <strong>{userToDelete?.name}</strong>? This action is irreversible.
              </DialogDescription>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!userToDelete) return;
                    deleteUserMutation.mutate(userToDelete.id);
                  }}
                  disabled={deleteUserMutation.isPending}
                >
                  {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
