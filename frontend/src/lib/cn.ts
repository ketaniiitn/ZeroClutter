type ClassPrimitive = string | number | bigint | boolean | undefined | null

export function cn(...classes: (ClassPrimitive | ClassPrimitive[])[]): string {
  return classes
    .flat()
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .join(' ')
}
