/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, AdminUserInfo } from '@cloudbeaver/core-sdk';

import { AuthInfoService } from '../AuthInfoService';
import { AuthProviderService } from '../AuthProviderService';
import { UsersResource } from './UsersResource';

@injectable()
export class UsersManagerService {
  constructor(
    private graphQLService: GraphQLService,
    private authProviderService: AuthProviderService,
    private authInfoService: AuthInfoService,
    readonly users: UsersResource
  ) {
  }

  async create(userId: string, update?: boolean): Promise<AdminUserInfo> {
    const { user } = await this.graphQLService.gql.createUser({ userId });

    if (update) {
    // TODO: maybe better to do refresh
      this.users.data.push(user as AdminUserInfo);
    }
    return user as AdminUserInfo;
  }

  async grantRole(userId: string, roleId: string, update?: boolean) {
    await this.graphQLService.gql.grantUserRole({ userId, roleId });
    if (update) {
      await this.users.refresh(userId);
    }
  }

  async delete(userId: string, update?: boolean) {
    if (this.authInfoService.userInfo?.userId === userId) {
      throw new Error('You can\'t delete current logged user');
    }
    await this.graphQLService.gql.deleteUser({ userId });

    if (update) {
      await this.users.refresh(userId);
    }
  }

  async updateCredentials(userId: string, credentials: Record<string, any>) {
    const provider = 'local';
    const processedCredentials = await this.authProviderService.processCredentials(provider, credentials);

    await this.graphQLService.gql.setUserCredentials({
      providerId: provider,
      userId,
      credentials: processedCredentials,
    });
  }
}
