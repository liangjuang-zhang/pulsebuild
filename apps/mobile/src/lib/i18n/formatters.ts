/**
 * 国际化格式化工具函数
 * Internationalization formatting utility functions
 */

/**
 * 格式化日期
 * Format a date according to the specified locale
 *
 * @param date - The date to format
 * @param locale - The locale to use for formatting (e.g., 'en', 'zh')
 * @param options - Optional Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string => {
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(date);
  } catch (error) {
    // Fallback to simple date string if Intl.DateTimeFormat fails
    console.warn('Date formatting failed, using fallback:', error);
    return date.toLocaleDateString();
  }
};

/**
 * 格式化相对时间
 * Format relative time (e.g., "2 hours ago")
 *
 * @param date - The date to format relative to now
 * @param locale - The locale to use
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: Date, locale: string): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) {
    return locale === 'zh' ? '刚刚' : 'Just now';
  }
  if (diffMinutes < 60) {
    return locale === 'zh'
      ? `${diffMinutes} 分钟前`
      : `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return locale === 'zh'
      ? `${diffHours} 小时前`
      : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  // For older dates, use standard date format
  return formatDate(date, locale);
};