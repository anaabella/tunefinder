'use client';

import { useTheme } from 'next-themes';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, ListX, Sun, Moon, Monitor } from 'lucide-react';
import { signOut } from 'firebase/auth';

export function SettingsMenu() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { theme, setTheme } = useTheme();

  if (isUserLoading) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Ajustes</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>Ajustes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <ListX className="mr-2" />
          <span>Ignorar playlist</span>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === 'light' && <Sun className="mr-2" />}
            {theme === 'dark' && <Moon className="mr-2" />}
            {theme === 'system' && <Monitor className="mr-2" />}
            <span>Cambiar tema</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                Claro
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                Oscuro
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                Sistema
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut(auth)}>
              <LogOut className="mr-2" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
