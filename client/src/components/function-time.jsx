export function getTimeStamp(date) {
  const now = Date.now();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0)
      return (seconds > 1) ? seconds + " seconds ago" : seconds + " second ago";
  const hours = Math.floor(minutes / 60);
  if (hours === 0) 
      return (minutes > 1) ? minutes +  " minutes ago" : minutes + " minute ago";
  const days = Math.floor(hours / 24);
  if(days === 0) 
      return (hours > 1) ? hours + " hours ago" : hours + " hour ago";
  const months = Math.floor(days / 30);
  if(months === 0) 
      return (days > 1) ? days + " days ago" : days + " day ago";
  const years = Math.floor(months / 12);
  if(years === 0) 
      return (months > 1) ? months + " months ago" : months + " month ago";
  return (years > 1) ? years + " years ago" : years + " year ago";
}