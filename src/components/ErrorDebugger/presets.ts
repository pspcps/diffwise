export interface DebugPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  log: string;
}

export const DEBUG_PRESETS: DebugPreset[] = [
  {
    id: 'dotnet_api_error',
    name: 'C# .NET Enterprise Microservice (Payment Gateway HTTP 403)',
    description: 'Structured JSON log with correlation IDs, tenant context, and 5-tier call stack',
    badge: 'C# .NET',
    log: `{ "date": "2026-11-04T08:15:32.418Z", "level": "ERROR", "logger": "Enterprise.Payments.Gateway.Client", "exception_type": "System.UnauthorizedAccessException", "exception_method": "ProcessPaymentAsync()", "exception_stacktrace": "   at Enterprise.Payments.Gateway.HttpClient.HandleErrorResponse(HttpResponseMessage response)\\n   at Enterprise.Payments.Gateway.HttpClient.SendRequestAsync[T](HttpRequestMessage request, CancellationToken ct)\\n   at Enterprise.Payments.Gateway.Accessors.PaymentAccessor.AuthorizeCharge(ChargeRequest request) in /app/src/Enterprise.Payments/Accessors/PaymentAccessor.cs:line 48\\n   at Enterprise.Orders.Services.OrderFulfillmentService.CheckoutOrder(OrderDto order) in /app/src/Enterprise.Orders/Services/OrderFulfillmentService.cs:line 95\\n   at Enterprise.Orders.Controllers.CheckoutController.SubmitOrder(SubmitOrderRequest request) in /app/src/Enterprise.Orders/Controllers/CheckoutController.cs:line 142", "ctx_user_id": "usr_99481b0a", "ctx_tenant_id": 4028, "ctx_correlation_id": "req-88912-ab7" }`,
  },
  {
    id: 'broken_json',
    name: 'Broken & Truncated JSON Log (Auto-Repair Resilience)',
    description: 'Incomplete JSON cut off mid-payload with unclosed braces and quotes',
    badge: 'Broken JSON',
    log: `{ "date": "2026-11-04T10:14:02.193Z", "level": "FATAL", "logger": "BillingService.Worker", "exception_type": "System.NullReferenceException", "exception_stacktrace": "   at App.Billing.InvoiceService.CalculateTotal() in /app/Billing/InvoiceService.cs:line 84\\n   at App.Billing.InvoiceController.GenerateInvoice() in /app/Billing/InvoiceController.cs:line 45", "ctx_user": "usr-88921", "ctx_invoice_id": 90124`,
  },
  {
    id: 'java_spring',
    name: 'Java Spring Boot (NullPointerException)',
    description: 'Enterprise Java call stack with controller, service and repository layers',
    badge: 'Java JVM',
    log: `2026-11-04 09:30:15.402 ERROR [dispatch-pool-4] com.enterprise.order.OrderService - Failed to process checkout
java.lang.NullPointerException: Cannot invoke "com.enterprise.model.User.getBillingAddress()" because "user" is null
	at com.enterprise.order.PaymentProcessor.charge(PaymentProcessor.java:78)
	at com.enterprise.order.OrderService.processOrder(OrderService.java:142)
	at com.enterprise.order.OrderService.checkout(OrderService.java:55)
	at com.enterprise.controller.OrderController.submitOrder(OrderController.java:89)
	at org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:880)`,
  },
  {
    id: 'python_fastapi',
    name: 'Python FastAPI / Celery (KeyError)',
    description: 'Python traceback showing sequential call flow from endpoint to crash',
    badge: 'Python',
    log: `Traceback (most recent call last):
  File "/app/routers/telemetry.py", line 58, in get_vehicle_status
    status = await telemetry_service.compute_metrics(vehicle_id)
  File "/app/services/telemetry_service.py", line 112, in compute_metrics
    device_data = await iot_gateway.fetch_latest_ping(vehicle_id)
  File "/app/gateways/iot_gateway.py", line 34, in fetch_latest_ping
    return raw_telemetry["sensors"]["gps"]["coordinates"]
KeyError: 'coordinates'`,
  },
  {
    id: 'nodejs_typeerror',
    name: 'Node.js / TypeScript (TypeError in Handler)',
    description: 'V8 stack trace with module path and line:column position',
    badge: 'Node.js',
    log: `TypeError: Cannot read properties of undefined (reading 'permissions')
    at PermissionValidator.verifyRole (/app/src/security/PermissionValidator.ts:32:27)
    at AuthMiddleware.authenticate (/app/src/middleware/AuthMiddleware.ts:64:18)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:114:3)`,
  },
];
