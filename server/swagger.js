export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Vendor Platform API',
    version: '1.0.0',
    description:
      'REST API for the Vendor Registration & Management Platform. All protected routes require a JWT Bearer token obtained from the login endpoints.',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Local development server' }],
  tags: [
    { name: 'Health', description: 'Server health check' },
    { name: 'Auth', description: 'Authentication for admins and vendors' },
    { name: 'Vendors', description: 'Vendor management' },
    { name: 'Invoices', description: 'Invoice submission and management' },
    { name: 'Documents', description: 'Document upload and review' },
    { name: 'Notifications', description: 'In-app notifications' },
    { name: 'Audit', description: 'Admin-only audit log' },
    { name: 'Services', description: 'Service catalogue' },
    { name: 'Settings', description: 'Platform settings and admin users' },
    { name: 'Activities', description: 'Vendor activity feed' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from /api/auth/admin/login or /api/auth/vendor/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      Success: {
        type: 'object',
        properties: { success: { type: 'boolean', example: true } },
      },
      Vendor: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'OSL-2025-ABC-1234' },
          companyName: { type: 'string' },
          businessType: { type: 'string' },
          productsServices: { type: 'string' },
          website: { type: 'string' },
          streetAddress: { type: 'string' },
          streetAddress2: { type: 'string' },
          city: { type: 'string' },
          region: { type: 'string' },
          postalCode: { type: 'string' },
          country: { type: 'string' },
          companyInfo: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          status: { type: 'string', enum: ['Pending Review', 'Approved', 'Rejected', 'Inactive'] },
          rejectionReason: { type: 'string', nullable: true },
          selfRegistered: { type: 'boolean' },
          hasPassword: { type: 'boolean' },
          submittedAt: { type: 'string', format: 'date-time' },
          statusUpdatedAt: { type: 'string', format: 'date-time', nullable: true },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'INV-1700000000000' },
          vendorCode: { type: 'string' },
          invoiceNumber: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'number' },
          status: { type: 'string', enum: ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Paid'] },
          serviceId: { type: 'string', nullable: true },
          serviceName: { type: 'string', nullable: true },
          dueDate: { type: 'string', format: 'date', nullable: true },
          notes: { type: 'string', nullable: true },
          rejectionReason: { type: 'string', nullable: true },
          paymentDate: { type: 'string', format: 'date', nullable: true },
          paymentMethod: { type: 'string', nullable: true },
          paymentReference: { type: 'string', nullable: true },
          paymentNotes: { type: 'string', nullable: true },
          lineItems: { type: 'array', items: { $ref: '#/components/schemas/LineItem' } },
          submittedAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      LineItem: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unitPrice: { type: 'number' },
          amount: { type: 'number' },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          vendorCode: { type: 'string' },
          documentName: { type: 'string' },
          documentType: { type: 'string' },
          expiryDate: { type: 'string', format: 'date', nullable: true },
          notes: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['Pending Review', 'Approved', 'Rejected'] },
          rejectionReason: { type: 'string', nullable: true },
          fileUrl: { type: 'string', nullable: true },
          fileOriginalName: { type: 'string', nullable: true },
          fileMimeType: { type: 'string', nullable: true },
          fileSize: { type: 'integer', nullable: true },
          uploadedAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          vendorCode: { type: 'string', nullable: true },
          isAdmin: { type: 'boolean' },
          type: { type: 'string', enum: ['info', 'success', 'error'] },
          title: { type: 'string' },
          message: { type: 'string' },
          read: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditEntry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          action: { type: 'string' },
          details: { type: 'object' },
          performedBy: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Service: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          unit: { type: 'string' },
          unitPrice: { type: 'number' },
          description: { type: 'string' },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Activity: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          vendorCode: { type: 'string' },
          type: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          metadata: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    // ── Health ────────────────────────────────────────────────────────────────
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Server is up',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, timestamp: { type: 'string', format: 'date-time' } } },
              },
            },
          },
        },
      },
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    '/api/auth/admin/login': {
      post: {
        tags: ['Auth'],
        summary: 'Admin login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        username: { type: 'string' },
                        role: { type: 'string' },
                        mustChangePw: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Missing credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/admin/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Admin change password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'currentPassword', 'newPassword'],
                properties: {
                  username: { type: 'string' },
                  currentPassword: { type: 'string', format: 'password' },
                  newPassword: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password changed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          400: { description: 'Missing fields', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Wrong current password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/admin/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Admin forgot password — send reset email',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } },
        },
        responses: {
          200: { description: 'Always returns success (prevents email enumeration)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
    },
    '/api/auth/admin/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Admin reset password with token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: { token: { type: 'string' }, newPassword: { type: 'string', format: 'password' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          400: { description: 'Invalid or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/vendor/login': {
      post: {
        tags: ['Auth'],
        summary: 'Vendor login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vendorCode'],
                properties: {
                  vendorCode: { type: 'string', example: 'OSL-2025-ABC-1234' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { token: { type: 'string' }, vendor: { $ref: '#/components/schemas/Vendor' } },
                },
              },
            },
          },
          400: { description: 'Missing vendor code or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Account rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/vendor/set-password': {
      post: {
        tags: ['Auth'],
        summary: 'Vendor set or change password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vendorCode', 'newPassword'],
                properties: {
                  vendorCode: { type: 'string' },
                  newPassword: { type: 'string', format: 'password' },
                  currentPassword: { type: 'string', format: 'password', description: 'Required when changing an existing password' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password set', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          400: { description: 'Missing fields', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Wrong current password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/vendor/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Vendor forgot password — send reset email',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } },
        },
        responses: {
          200: { description: 'Always returns success', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
    },
    '/api/auth/vendor/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Vendor reset password with token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: { token: { type: 'string' }, newPassword: { type: 'string', format: 'password' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          400: { description: 'Invalid or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh JWT token',
        description: 'Exchanges a still-valid token for a fresh one with a new expiry.',
        responses: {
          200: {
            description: 'New token',
            content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } },
          },
          401: { description: 'Invalid or missing token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Vendors ───────────────────────────────────────────────────────────────
    '/api/vendors': {
      get: {
        tags: ['Vendors'],
        summary: 'List vendors (admin: all; vendor: self only)',
        responses: {
          200: { description: 'Array of vendors', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Vendor' } } } } },
        },
      },
      post: {
        tags: ['Vendors'],
        summary: 'Create vendor (admin only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['companyName', 'email'],
                properties: {
                  companyName: { type: 'string' },
                  businessType: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  password: { type: 'string', format: 'password' },
                  status: { type: 'string', enum: ['Pending Review', 'Approved', 'Rejected', 'Inactive'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Vendor created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vendor' } } } },
          409: { description: 'Duplicate vendor', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/vendors/register': {
      post: {
        tags: ['Vendors'],
        summary: 'Self-registration (public — no auth required)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['companyName', 'email', 'password'],
                properties: {
                  companyName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  businessType: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration submitted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vendor' } } } },
          409: { description: 'Duplicate email or company name', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/vendors/{id}': {
      get: {
        tags: ['Vendors'],
        summary: 'Get vendor by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Vendor object', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vendor' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Vendors'],
        summary: 'Update vendor (admin: all fields; vendor: contact fields only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Vendor' } } },
        },
        responses: {
          200: { description: 'Updated vendor', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vendor' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Vendors'],
        summary: 'Delete vendor (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/vendors/{id}/status': {
      patch: {
        tags: ['Vendors'],
        summary: 'Update vendor status (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['Pending Review', 'Approved', 'Rejected', 'Inactive'] },
                  rejectionReason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated vendor', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vendor' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Invoices ──────────────────────────────────────────────────────────────
    '/api/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'List invoices',
        parameters: [
          { name: 'vendorCode', in: 'query', schema: { type: 'string' }, description: 'Admin only — filter by vendor' },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Array of invoices', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Invoice' } } } } },
        },
      },
      post: {
        tags: ['Invoices'],
        summary: 'Create invoice',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  amount: { type: 'number' },
                  serviceId: { type: 'string' },
                  serviceName: { type: 'string' },
                  dueDate: { type: 'string', format: 'date' },
                  notes: { type: 'string' },
                  lineItems: { type: 'array', items: { $ref: '#/components/schemas/LineItem' } },
                  vendorCode: { type: 'string', description: 'Admin only — specify vendor' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Invoice created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/invoices/{id}': {
      get: {
        tags: ['Invoices'],
        summary: 'Get invoice by ID (includes status history)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Invoice with status history', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Invoices'],
        summary: 'Update invoice (vendor: only Submitted status)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } },
        },
        responses: {
          200: { description: 'Updated invoice', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } } },
          400: { description: 'Cannot edit invoice in current status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Invoices'],
        summary: 'Delete invoice (vendor: only Submitted status)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/invoices/{id}/status': {
      patch: {
        tags: ['Invoices'],
        summary: 'Change invoice status (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Paid'] },
                  rejectionReason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated invoice', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/invoices/{id}/payment': {
      patch: {
        tags: ['Invoices'],
        summary: 'Record payment for invoice (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  paymentDate: { type: 'string', format: 'date' },
                  paymentMethod: { type: 'string' },
                  paymentReference: { type: 'string' },
                  paymentNotes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Invoice updated to Paid', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Documents ─────────────────────────────────────────────────────────────
    '/api/documents': {
      get: {
        tags: ['Documents'],
        summary: 'List documents',
        parameters: [
          { name: 'vendorCode', in: 'query', schema: { type: 'string' }, description: 'Admin only' },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Array of documents', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Document' } } } } },
        },
      },
      post: {
        tags: ['Documents'],
        summary: 'Upload new document (multipart/form-data, max 5 MB, PDF/JPEG/PNG)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['documentName', 'documentType', 'file'],
                properties: {
                  documentName: { type: 'string' },
                  documentType: { type: 'string' },
                  expiryDate: { type: 'string', format: 'date' },
                  notes: { type: 'string' },
                  vendorCode: { type: 'string', description: 'Admin only' },
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Document uploaded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Document' } } } },
          400: { description: 'Missing vendor code', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/documents/{id}': {
      get: {
        tags: ['Documents'],
        summary: 'Get document by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Document', content: { 'application/json': { schema: { $ref: '#/components/schemas/Document' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Documents'],
        summary: 'Delete document (and file from disk)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/documents/{id}/reupload': {
      put: {
        tags: ['Documents'],
        summary: 'Re-upload a rejected document (vendor only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  notes: { type: 'string' },
                  expiryDate: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated document', content: { 'application/json': { schema: { $ref: '#/components/schemas/Document' } } } },
          400: { description: 'Document is not in Rejected status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/documents/{id}/status': {
      patch: {
        tags: ['Documents'],
        summary: 'Update document status (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['Pending Review', 'Approved', 'Rejected'] },
                  rejectionReason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated document', content: { 'application/json': { schema: { $ref: '#/components/schemas/Document' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get notifications (admin: admin notifications; vendor: own notifications)',
        responses: {
          200: { description: 'Array of notifications', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Notification' } } } } },
        },
      },
      delete: {
        tags: ['Notifications'],
        summary: 'Clear all notifications for current user',
        responses: {
          200: { description: 'Cleared', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
    },
    '/api/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        responses: {
          200: { description: 'Marked read', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
    },
    '/api/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark a single notification as read',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Marked read', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
    },
    '/api/notifications/{id}': {
      delete: {
        tags: ['Notifications'],
        summary: 'Delete a notification',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
    },

    // ── Audit ─────────────────────────────────────────────────────────────────
    '/api/audit': {
      get: {
        tags: ['Audit'],
        summary: 'Get audit log (admin only)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          200: { description: 'Array of audit entries (max 500)', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AuditEntry' } } } } },
        },
      },
      post: {
        tags: ['Audit'],
        summary: 'Log a custom audit entry (admin only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: { type: 'string' },
                  details: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Entry created', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' } } } } } },
        },
      },
      delete: {
        tags: ['Audit'],
        summary: 'Clear entire audit log (admin only)',
        responses: {
          200: { description: 'Cleared', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
    },

    // ── Services ──────────────────────────────────────────────────────────────
    '/api/services': {
      get: {
        tags: ['Services'],
        summary: 'List all services',
        responses: {
          200: { description: 'Array of services', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Service' } } } } },
        },
      },
      post: {
        tags: ['Services'],
        summary: 'Create service (admin only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  category: { type: 'string' },
                  unit: { type: 'string' },
                  unitPrice: { type: 'number' },
                  description: { type: 'string' },
                  active: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Service created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Service' } } } },
        },
      },
    },
    '/api/services/{id}': {
      put: {
        tags: ['Services'],
        summary: 'Update service (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Service' } } },
        },
        responses: {
          200: { description: 'Updated service', content: { 'application/json': { schema: { $ref: '#/components/schemas/Service' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Services'],
        summary: 'Delete service (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Settings ──────────────────────────────────────────────────────────────
    '/api/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get all settings (public)',
        security: [],
        responses: {
          200: { description: 'Key-value settings object', content: { 'application/json': { schema: { type: 'object', additionalProperties: { type: 'string' } } } } },
        },
      },
      put: {
        tags: ['Settings'],
        summary: 'Update settings (admin only)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', additionalProperties: { type: 'string' } } } },
        },
        responses: {
          200: { description: 'Updated settings object', content: { 'application/json': { schema: { type: 'object', additionalProperties: { type: 'string' } } } } },
        },
      },
    },
    '/api/settings/admin-users': {
      get: {
        tags: ['Settings'],
        summary: 'List admin users (admin only)',
        responses: {
          200: {
            description: 'Array of admin users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      username: { type: 'string' },
                      role: { type: 'string' },
                      mustChangePw: { type: 'boolean' },
                      created_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Settings'],
        summary: 'Create admin user (admin only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'username', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  username: { type: 'string' },
                  password: { type: 'string', format: 'password' },
                  role: { type: 'string', enum: ['Admin', 'Super Admin'], default: 'Admin' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Admin user created', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, username: { type: 'string' }, role: { type: 'string' } } } } } },
          409: { description: 'Username or email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/settings/admin-users/{id}': {
      delete: {
        tags: ['Settings'],
        summary: 'Delete admin user (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          400: { description: 'Cannot delete last Super Admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/settings/admin-users/{id}/password': {
      patch: {
        tags: ['Settings'],
        summary: 'Reset admin user password (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['newPassword'],
                properties: { newPassword: { type: 'string', format: 'password' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          400: { description: 'Missing newPassword', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Activities ────────────────────────────────────────────────────────────
    '/api/activities': {
      get: {
        tags: ['Activities'],
        summary: 'Get vendor activity feed (last 100 entries)',
        parameters: [
          { name: 'vendorCode', in: 'query', schema: { type: 'string' }, description: 'Admin only — required when called by admin' },
        ],
        responses: {
          200: { description: 'Array of activities', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Activity' } } } } },
          400: { description: 'vendorCode required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Activities'],
        summary: 'Log a custom activity',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'title'],
                properties: {
                  type: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  metadata: { type: 'object' },
                  vendorCode: { type: 'string', description: 'Admin only' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Activity logged', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' } } } } } },
        },
      },
    },
  },
};
