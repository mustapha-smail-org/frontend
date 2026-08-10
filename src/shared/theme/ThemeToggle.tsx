import { Moon, Sun } from 'lucide-react'
import { useId } from 'react'

import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/shared/theme/use-theme'

/**
 * Dark-mode switch.
 *
 * The switch has two positions, but the underlying preference has three states:
 * until the user touches it, the preference stays `system` and the switch simply
 * reflects whatever the OS currently reports — so a visitor on a dark desktop
 * lands in dark mode without configuring anything, and follows their OS if it
 * changes later. Flipping the switch pins an explicit choice from then on.
 */
export function ThemeToggle() {
  const { resolved, setPreference } = useTheme()
  const labelId = useId()
  const isDark = resolved === 'dark'

  return (
    <div className="flex items-center gap-2">
      <Sun
        aria-hidden="true"
        className={isDark ? 'text-muted-foreground size-4' : 'text-foreground size-4'}
      />

      {/* The visible icons carry the meaning; the label is for assistive tech. */}
      <span id={labelId} className="sr-only">
        Dark mode
      </span>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setPreference(checked ? 'dark' : 'light')}
        aria-labelledby={labelId}
        data-testid="theme-toggle"
        className="cursor-pointer"
      />

      <Moon
        aria-hidden="true"
        className={isDark ? 'text-foreground size-4' : 'text-muted-foreground size-4'}
      />
    </div>
  )
}
