interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-stone-900 text-white">
      <div className="absolute inset-0 hero-pattern opacity-30" aria-hidden="true" />
      <div className="relative container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-5xl font-bold mb-3">{title}</h1>
        {description && <p className="text-lg text-stone-300 max-w-2xl">{description}</p>}
      </div>
    </section>
  );
}
