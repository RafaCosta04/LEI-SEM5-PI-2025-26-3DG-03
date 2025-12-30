import express from 'express';
import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';
import mongooseLoader from './mongoose';
import Logger from './logger';
import config from '../../config';
import swaggerLoader from './swagger';
import path from 'path';

export default async ({ expressApp }: { expressApp: express.Application }) => {
  const mongoConnection = await mongooseLoader();

  const incidentTypeSchema = {
    name: 'incidentTypeSchema',
    schema: '../persistence/schemas/incidentTypeSchema',
  }

  const operationPlanSchema = {
    name: 'operationPlanSchema',
    schema: '../persistence/schemas/operationPlanSchema',
  }

  const operationPlanController = {
    name: config.controllers.operationPlan.name,
    path: config.controllers.operationPlan.path
  }

  const operationPlanService = {
    name: config.services.operationPlan.name,
    path: config.services.operationPlan.path
  }

  const operationPlanRepo = {
    name: config.repos.operationPlan.name,
    path: config.repos.operationPlan.path
  }

  const incidentTypeController = {
    name: config.controllers.incidentType.name,
    path: config.controllers.incidentType.path
  }

  const incidentTypeRepo = {
    name: config.repos.incidentType.name,
    path: config.repos.incidentType.path
  }

  const incidentTypeService = {
    name: config.services.incidentType.name,
    path: config.services.incidentType.path
  }

  const vesselVisitExecutionSchema = {
    name: 'vesselVisitExecutionSchema',
    schema: '../persistence/schemas/vesselVisitExecutionSchema',
  }

  const vesselVisitExecutionController = {
    name: config.controllers.vesselVisitExecution.name,
    path: config.controllers.vesselVisitExecution.path
  }

  const vesselVisitExecutionRepo = {
    name: config.repos.vesselVisitExecution.name,
    path: config.repos.vesselVisitExecution.path
  }

  const vesselVisitExecutionService = {
    name: config.services.vesselVisitExecution.name,
    path: config.services.vesselVisitExecution.path
  }

  const incidentSchema = {
    name: 'incidentSchema',
    schema: '../persistence/schemas/incidentSchema',
  }

  const incidentController = {
    name: config.controllers.incident.name,
    path: config.controllers.incident.path
  }

  const incidentRepo = {
    name: config.repos.incident.name,
    path: config.repos.incident.path
  }

  const incidentService = {
    name: config.services.incident.name,
    path: config.services.incident.path
  }

  const complementaryTaskCategorySchema = {
    name: 'complementaryTaskCategorySchema',
    schema: '../persistence/schemas/complementaryTaskCategorySchema',
  }

  const complementaryTaskCategoryController = {
    name: config.controllers.complementaryTaskCategory.name,
    path: config.controllers.complementaryTaskCategory.path
  }

  const complementaryTaskCategoryRepo = {
    name: config.repos.complementaryTaskCategory.name,
    path: config.repos.complementaryTaskCategory.path
  }

  const complementaryTaskCategoryService = {
    name: config.services.complementaryTaskCategory.name,
    path: config.services.complementaryTaskCategory.path
  }

  
  const complementaryTaskSchema = {
    name: 'complementaryTaskSchema',
    schema: '../persistence/schemas/complementaryTaskSchema',
  }

  const complementaryTaskController = {
    name: config.controllers.complementaryTask.name,
    path: config.controllers.complementaryTask.path
  }

  const complementaryTaskRepo = {
    name: config.repos.complementaryTask.name,
    path: config.repos.complementaryTask.path
  }

  const complementaryTaskService = {
    name: config.services.complementaryTask.name,
    path: config.services.complementaryTask.path
  }

  //const userSchema = {
    // compare with the approach followed in repos and services
    //name: 'userSchema',
    //schema: '../persistence/schemas/userSchema',
  //}

  //const roleSchema = {
    // compare with the approach followed in repos and services
    //name: 'roleSchema',
    //schema: '../persistence/schemas/roleSchema',
  //}

  //const roleController = {
    //name: config.controllers.role.name,
    //path: config.controllers.role.path
  //}

  //const roleRepo = {
    //name: config.repos.role.name,
    //path: config.repos.role.path
  //}

  //const userRepo = {
    //name: config.repos.user.name,
    //path: config.repos.user.path
  //}

  //const roleService = {
    //name: config.services.role.name,
    //path: config.services.role.path
  //}

  await dependencyInjectorLoader({
    mongoConnection,
    schemas: [
      incidentTypeSchema,
      vesselVisitExecutionSchema,
      incidentSchema,
      complementaryTaskCategorySchema,
      complementaryTaskSchema,
      operationPlanSchema
    ],
    controllers: [
      incidentTypeController,
      vesselVisitExecutionController,
      incidentController,
      complementaryTaskCategoryController,
      complementaryTaskController,
      operationPlanController
    ],
    repos: [
      incidentTypeRepo,
      vesselVisitExecutionRepo,
      incidentRepo,
      complementaryTaskCategoryRepo,
      complementaryTaskRepo,
      operationPlanRepo
    ],
    services: [
      incidentTypeService,
      vesselVisitExecutionService,
      incidentService,
      complementaryTaskCategoryService,
      complementaryTaskService,
      operationPlanService
    ]
  });

  swaggerLoader(expressApp);

  await expressLoader({ app: expressApp });
};
