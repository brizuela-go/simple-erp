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
import { getPositions, createPosition } from "@/services/positions";
import { Position } from "@/types";
import { toast } from "sonner";

interface PositionComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function PositionCombobox({ value, onChange }: PositionComboboxProps) {
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const data = await getPositions();
      setPositions(data);
    } catch (error) {
      console.error("Error loading positions:", error);
      toast.error("Error al cargar puestos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePosition = async () => {
    const newPositionName = searchValue.trim();

    if (!newPositionName) {
      toast.error("Por favor ingresa un nombre para el puesto");
      return;
    }

    // Check if position already exists (case insensitive)
    const exists = positions.some(
      (p) => p.name.toLowerCase() === newPositionName.toLowerCase()
    );

    if (exists) {
      toast.error("Este puesto ya existe");
      return;
    }

    try {
      const positionId = await createPosition(newPositionName);

      // Add to local state
      const newPosition: Position = {
        id: positionId,
        name: newPositionName,
      };
      setPositions([...positions, newPosition]);

      // Select the new position
      onChange(newPositionName);
      setOpen(false);
      setSearchValue("");

      toast.success("Puesto creado exitosamente");
    } catch (error) {
      console.error("Error creating position:", error);
      toast.error("Error al crear puesto");
    }
  };

  const filteredPositions = positions.filter((position) =>
    position.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Seleccionar puesto..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Buscar o crear puesto..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No se encontró "{searchValue}"
            </p>
            <Button size="sm" onClick={handleCreatePosition}>
              <Plus className="h-4 w-4 mr-2" />
              Crear "{searchValue}"
            </Button>
          </CommandEmpty>
          <CommandGroup>
            {filteredPositions.map((position) => (
              <CommandItem
                key={position.id}
                value={position.name}
                onSelect={() => {
                  onChange(position.name);
                  setOpen(false);
                  setSearchValue("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === position.name ? "opacity-100" : "opacity-0"
                  )}
                />
                {position.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
