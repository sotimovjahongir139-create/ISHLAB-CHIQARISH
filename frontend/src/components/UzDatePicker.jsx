import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const UzDatePicker = ({ label, value, onChange, size = 'small', fullWidth = true, required, disabled, sx }) => (
  <DatePicker
    label={label}
    value={value ? dayjs(value) : null}
    onChange={(v) => onChange({ target: { value: v && v.isValid() ? v.format('YYYY-MM-DD') : '' } })}
    format="DD.MM.YYYY"
    slotProps={{ textField: { size, fullWidth, required, disabled, sx } }}
  />
);

export default UzDatePicker;
