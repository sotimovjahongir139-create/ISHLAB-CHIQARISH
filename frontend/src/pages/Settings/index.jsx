import {
  Box, Typography, Grid, Card, CardContent,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Switch, Divider, Button, TextField,
} from '@mui/material';

const Settings = () => (
  <Box>
    <Typography variant="h4" sx={{ mb: 3 }}>Sozlamalar</Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Umumiy sozlamalar</Typography>
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1.5 }}>
                <ListItemText primary="Til" secondary="Interfeys tili" />
                <ListItemSecondaryAction>
                  <Typography variant="body2" color="primary">O'zbek (Lotin)</Typography>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem disablePadding sx={{ py: 1.5 }}>
                <ListItemText primary="Vaqt mintaqasi" secondary="Joriy vaqt mintaqasi" />
                <ListItemSecondaryAction>
                  <Typography variant="body2" color="primary">Asia/Tashkent</Typography>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem disablePadding sx={{ py: 1.5 }}>
                <ListItemText primary="Bildirishnomalar" secondary="Push bildirishnomalarni yoqish" />
                <ListItemSecondaryAction>
                  <Switch defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem disablePadding sx={{ py: 1.5 }}>
                <ListItemText primary="Toshlanish ogohlantirishi" secondary="Faol toshlanishlar haqida ogohlantirish" />
                <ListItemSecondaryAction>
                  <Switch defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>KPI Maqsadlar</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="OEE Maqsad (%)" defaultValue="85" type="number" size="small" fullWidth />
              <TextField label="Sifat o'tish foizi (%)" defaultValue="98" type="number" size="small" fullWidth />
              <TextField label="Samaradorlik maqsad (%)" defaultValue="90" type="number" size="small" fullWidth />
              <Button variant="contained">Saqlash</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default Settings;
