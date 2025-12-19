import { Router } from 'express';
import incidentTypeRoute from './routes/IncidentTypeRoute';
import vesselVisitExecutionRoute from './routes/VesselVisitExecutionRoute';
import incidentRoute from './routes/IncidentRoute';

export default () => {
    const app = Router();
    incidentTypeRoute(app);
    vesselVisitExecutionRoute(app);
    incidentRoute(app);
    return app;
}