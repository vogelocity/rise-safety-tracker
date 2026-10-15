-- Optional map link per site. Only http(s) URLs, so a stored value is always safe to put in an href.
alter table public.sites
  add column if not exists map_url text
  check (map_url is null or map_url ~* '^https?://');
