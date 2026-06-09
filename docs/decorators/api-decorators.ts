export const ApiTags = (tags: string | string[]) => {
  const { ApiTags: NestApiTags } = require('@nestjs/swagger');
  return NestApiTags(tags);
};

export const ApiOperation = require('@nestjs/swagger').ApiOperation;
export const ApiResponse = require('@nestjs/swagger').ApiResponse;
export const ApiBearerAuth = require('@nestjs/swagger').ApiBearerAuth;
export const ApiUnauthorizedResponse =
  require('@nestjs/swagger').ApiUnauthorizedResponse;
export const ApiOkResponse = require('@nestjs/swagger').ApiOkResponse;
export const ApiExcludeEndpoint = require('@nestjs/swagger').ApiExcludeEndpoint;
export const ApiProperty = require('@nestjs/swagger').ApiProperty;
export const ApiPropertyOptional =
  require('@nestjs/swagger').ApiPropertyOptional;
export const ApiBody = require('@nestjs/swagger').ApiBody;
export const ApiQuery = require('@nestjs/swagger').ApiQuery;
export const ApiParam = require('@nestjs/swagger').ApiParam;
export const ApiHeader = require('@nestjs/swagger').ApiHeader;
export const ApiConsumes = require('@nestjs/swagger').ApiConsumes;
