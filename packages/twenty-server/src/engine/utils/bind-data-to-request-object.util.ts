import { type Request } from 'express';

import { type RawAuthContext } from 'src/engine/core-modules/auth/types/raw-auth-context.type';
import { resolveRequestLocale } from 'src/engine/utils/resolve-request-locale.util';

export const bindDataToRequestObject = (
  data: RawAuthContext,
  request: Request,
  metadataVersion: number | undefined,
) => {
  request.user = data.user;
  request.apiKey = data.apiKey;
  request.application = data.application;
  request.userWorkspace = data.userWorkspace;
  request.workspace = data.workspace;
  request.workspaceId = data.workspace?.id;
  request.workspaceMetadataVersion = metadataVersion;
  request.workspaceMemberId = data.workspaceMemberId;
  request.workspaceMember = data.workspaceMember;
  request.userWorkspaceId = data.userWorkspaceId;
  request.authProvider = data.authProvider;
  request.impersonationContext = data.impersonationContext;
  request.tokenType = data.tokenType;

  request.locale = resolveRequestLocale({
    headerLocale: request.headers['x-locale'],
    userWorkspaceLocale: data.userWorkspace?.locale,
  });
};
