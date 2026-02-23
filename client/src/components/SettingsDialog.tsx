import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, X, Train, MapPin } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Form schema with explicit coercion for numbers
const formSchema = z.object({
  walkTimeMinutes: z.coerce.number().min(1, "Must be at least 1 minute").max(60, "Max 60 minutes"),
  directionId: z.coerce.number().min(0).max(1),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { data: settings } = useSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      walkTimeMinutes: 6,
      directionId: 0,
    },
  });

  // Sync form when settings data arrives
  useEffect(() => {
    if (settings) {
      form.reset({
        walkTimeMinutes: settings.walkTimeMinutes,
        directionId: settings.directionId,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: FormValues) => {
    updateSettings(data, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-secondary w-12 h-12 transition-all duration-200 hover:rotate-90"
        >
          <Settings className="w-5 h-5 text-foreground" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Commute Settings
            </DialogTitle>
          </DialogHeader>
          <p className="text-primary-foreground/80 mt-2">
            Configure your walk time and typical direction to get accurate departure alerts.
          </p>
        </div>

        <div className="p-6 bg-card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="walkTimeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Walk Time to Station (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        className="text-lg py-6 rounded-xl border-border bg-secondary/50 focus:bg-background focus:ring-primary/20" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      How long it takes you to walk from your door to the platform at JFK/UMass.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="directionId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Travel Direction</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={String(field.value)}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="0" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-secondary hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                            <Train className="mb-3 h-6 w-6" />
                            <span className="font-semibold text-center">Southbound</span>
                            <span className="text-xs text-muted-foreground mt-1 text-center">Ashmont / Braintree</span>
                          </FormLabel>
                        </FormItem>
                        
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="1" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-secondary hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                            <Train className="mb-3 h-6 w-6" />
                            <span className="font-semibold text-center">Northbound</span>
                            <span className="text-xs text-muted-foreground mt-1 text-center">Alewife</span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 pb-2">
                <Button 
                  type="submit" 
                  className="w-full py-6 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:translate-y-0"
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
