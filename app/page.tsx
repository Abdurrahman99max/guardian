import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(39,69,91,0.1),transparent_42%)]" />
      <section className="border-border bg-card relative w-full max-w-xl rounded-2xl border px-8 py-12 shadow-[0_24px_80px_-36px_rgba(20,36,51,0.32)] sm:px-12">
        <div className="mb-12 flex items-center gap-3">
          <span className="bg-primary h-2.5 w-2.5 rounded-full" />
          <span className="text-muted-foreground text-sm font-medium tracking-[0.18em] uppercase">
            Guardian
          </span>
        </div>

        <div className="space-y-5">
          <p className="text-primary text-sm font-medium">Engineering foundation</p>
          <h1 className="text-foreground max-w-md text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            A considered start.
          </h1>
          <p className="text-muted-foreground max-w-lg text-base leading-7">
            Guardian&apos;s application foundation is configured and ready for the next mission.
          </p>
        </div>

        <div className="mt-10">
          <Button disabled>Foundation ready</Button>
        </div>
      </section>
    </main>
  );
}
