import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { openapiSpecification } from '../src/docs/swagger.js';
import swaggerUi from 'swagger-ui-express';

describe('Swagger UI & OpenAPI Documentation Verification', () => {
  test('swagger-ui-express module is imported properly', () => {
    assert.ok(swaggerUi, 'swaggerUi should be defined');
    assert.equal(typeof swaggerUi.serve, 'object');
    assert.equal(typeof swaggerUi.setup, 'function');
  });

  test('openapiSpecification has valid OpenAPI 3.0 structure', () => {
    assert.equal(openapiSpecification.openapi, '3.0.0');
    assert.equal(openapiSpecification.info.version, '1.5.0');
    assert.ok(openapiSpecification.info.title.includes('Tekna ERP'));
    assert.ok(openapiSpecification.paths, 'paths must be defined');
  });

  test('security schemes include InternalTokenAuth and UserHeaderAuth', () => {
    const schemes = openapiSpecification.components.securitySchemes;
    assert.ok(schemes.InternalTokenAuth, 'InternalTokenAuth scheme must exist');
    assert.equal(schemes.InternalTokenAuth.name, 'X-Internal-Token');
    assert.ok(schemes.UserHeaderAuth, 'UserHeaderAuth scheme must exist');
    assert.equal(schemes.UserHeaderAuth.name, 'X-User-Id');
  });

  test('paths include all PRD v1.5 core business endpoints', () => {
    const requiredPaths = [
      '/api/v1/orders',
      '/api/v1/orders/{id}',
      '/api/v1/orders/{id}/approve',
      '/api/v1/orders/{id}/complete',
      '/api/v1/orders/{id}/maintenance',
      '/api/v1/orders/{id}/status',
      '/api/v1/orders/{orderId}/assignments',
      '/api/v1/assignments/{id}',
      '/api/v1/assignments/{id}/status',
      '/api/v1/orders/{orderId}/progress',
      '/api/v1/progress/{id}',
      '/api/v1/invoices',
      '/api/v1/invoices/{id}/pay',
      '/api/v1/payments',
      '/api/v1/payments/{id}/pay',
    ];

    for (const path of requiredPaths) {
      assert.ok(
        openapiSpecification.paths[path],
        `Path ${path} must be documented in OpenAPI specification`
      );
    }
  });
});
