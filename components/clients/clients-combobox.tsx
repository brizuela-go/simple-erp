"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Client } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient, getClients } from "@/services/clients";

interface ClientComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function ClientCombobox({ value, onChange }: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast.error("Por favor ingresa un nombre");
      return;
    }

    setCreating(true);
    try {
      const newClient: Partial<Client> = {
        name: newClientName,
        address: "",
        phone: "",
        price: 0,
        hasCredit: false,
        routes: [],
      };

      const clientId = await createClient(newClient);

      // Add to local state
      const createdClient = { ...newClient, id: clientId } as Client;
      setClients([...clients, createdClient]);

      // Select the new client
      onChange(clientId);

      setShowCreateDialog(false);
      setNewClientName("");
      toast.success("Cliente creado exitosamente");
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Error al crear cliente");
    } finally {
      setCreating(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedClient ? selectedClient.name : "Seleccionar cliente..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar cliente..." />
            <CommandEmpty className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                No se encontró el cliente
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear nuevo
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onChange(client.id!);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre del cliente"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateClient();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateClient}
                disabled={creating}
                className="flex-1"
              >
                Crear Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
