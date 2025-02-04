export function getTodayFormatted(): string {
    const now = new Date();
  
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }
  