import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module.js';
import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { AutoWriteService } from './service/auto-write.service.js';
import { AutoReadService } from './service/auto-read.service.js';
import { AutoQueryResolver } from './resolver/auto-query.resolver.js';
import { AutoMutationResolver } from './resolver/auto-mutation.resolver.js';
import { QueryBuilder } from './service/query-builder.js';
import { AutoGetController } from './controller/auto-get.controller.js';
import { AutoWriteController } from './controller/auto-write.controller.js';
import { entities } from './entity/entities.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Autos.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [KeycloakModule, MailModule, TypeOrmModule.forFeature(entities)],
    controllers: [AutoGetController, AutoWriteController],
    providers: [
        AutoReadService,
        AutoWriteService,
        AutoQueryResolver,
        AutoMutationResolver,
        QueryBuilder,
    ],
    exports: [AutoReadService, AutoWriteService],
})
export class AutoModule {}
