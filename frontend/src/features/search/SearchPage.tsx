import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { SearchResultCard } from '../../components/shared/SearchResultCard';
import { Card } from '../../components/ui/Card';
import { searchService } from '../../services/searchService';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const category = params.get('cat') ?? undefined;
  const categories = searchService.getCategories();

  const results = useMemo(
    () => searchService.search(query, category),
    [query, category],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900">Explore TruthHubBD</h1>
        <p className="mt-2 text-slate-500">
          Phase 1 search uses local mock data across businesses and products.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams(params);
            next.delete('cat');
            setParams(next);
          }}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            !category ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
          }`}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set('cat', item.slug);
              setParams(next);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              category === item.slug
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {query ? (
        <p className="mb-4 text-sm text-slate-500">
          Showing results for <span className="font-semibold text-navy-900">"{query}"</span>
          {category ? ` in ${categories.find((c) => c.slug === category)?.name}` : ''}
        </p>
      ) : null}

      {results.length > 0 ? (
        <div className="grid gap-4">
          {results.map((result) => (
            <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <SearchX className="h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-bold text-navy-900">No results found</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Try another keyword, remove the category filter, or browse featured businesses from the homepage.
          </p>
        </Card>
      )}
    </div>
  );
}
