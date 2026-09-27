export function getOptimizedCloudinaryUrl(originalUrl: string | undefined | null, variant: 'feed' | 'detail'): string | undefined {
  if (!originalUrl) return undefined;
  if (originalUrl.includes('/upload/')) {
    const transform = variant === 'feed' ? 'c_limit,w_800,q_auto,f_auto' : 'c_limit,w_2000,q_auto,f_auto';
    return originalUrl.replace('/upload/', `/upload/${transform}/`);
  }
  return originalUrl;
}
