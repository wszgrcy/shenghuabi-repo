import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn'; // ES 2015

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');
export function formatTime(inputTime: any) {
  const inputDate = dayjs(inputTime);
  const now = dayjs();
  const diffInDays = now.diff(inputDate, 'day');

  if (diffInDays < 3 && diffInDays >= 0) {
    return inputDate.fromNow();
  } else {
    return inputDate.format('YYYY-MM-DD HH:mm');
  }
}
