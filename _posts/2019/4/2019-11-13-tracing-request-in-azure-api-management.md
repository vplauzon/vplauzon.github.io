---
title: Tracing request in Azure API Management
date: 2019-11-13 03:30:05 -08:00
permalink: /2019/11/13/tracing-request-in-azure-api-management/
categories:
- Solution
tags:
- API
- Operations
---
<img style="float:right;padding-right:20px;" title="From pexels.com" src="/assets/posts/2019/4/tracing-request-in-azure-api-management/animal-foot-prints-on-snow-near-mountain-at-daytime-669796-e1573575791715.jpg" />

<a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-key-concepts">Azure API Management</a> (API-M) is an <a href="https://docs.microsoft.com/en-us/azure/architecture/microservices/design/gateway">API Gateway</a> solution.

It is quite easy to create an API in API-M, connect it to a back-end API and test it in the portal.

What happen when you test it from another client platform (e.g. Postman) and it fails?  You have no visibility into what failed.

Maybe you did put <a href="https://vincentlauzon.com/2019/07/31/api-management-oauth-and-private-back-ends/">authentication logic</a> in and the client fails to pass, but you do not know which policy is failing and why.

In this article, we'll see how we can use tracing to see exactly what we would see in the Portal experience.

This article is an extension to the <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-howto-api-inspector">online article about API debugging</a>.

There is no code for this article.  It is <em>that</em> simple!

<h2>A simple API</h2>

Let's take a simple API:  the <em>Echo API</em>.  This API comes with any API-M sku.

For the purpose of this article, we can simply create a <em>Developer SKU</em> API-M.

Let's open the <em>APIs</em> pane, select the <em>Echo API</em> api, the one-before-the-last-one operation (i.e. the first <em>GET Retrieve resource</em>) and the <em>Test</em> tab.

<img src="/assets/posts/2019/4/tracing-request-in-azure-api-management/test-portal.png" alt="Portal test" />

We should see the <em>Request URL</em>.  In our case the value is <code>https://vpl-api.azure-api.net/echo/resource?param1=sample</code>.

Let's copy that value.

If we press the <em>Send</em> button, the Portal will initiate a test request.  We should quickly see the result coming by.  If we then select the <em>Trace</em> tab, we should see the traces we are after.

<img src="/assets/posts/2019/4/tracing-request-in-azure-api-management/trace-portal.png" alt="Trace Portal" />

This is what we want to replicate outside the Portal.

<h2>Calling the API from postman (or any client)</h2>

Here we'll do a call from <a href="https://www.getpostman.com/">Postman</a>.  This can easily be done with other tools, e.g. <a href="https://www.telerik.com/fiddler">Fiddler</a>, or custom applications.

First, we'll need a subscription key in order to use the API.  For that, let's go to the <em>Subscriptions</em> pane, select the ellipse (i.e. ...) on the right to the first product (<em>Starter</em>) and select <em>Show/hide keys</em>.

<img src="/assets/posts/2019/4/tracing-request-in-azure-api-management/key.png" alt="Keys" />

From there we can copy the <em>Primary key</em>.

We can now open Postman.

We will select the <em>GET</em> HTTP method.  We will paste the URL we picked in the last section (in our case <code>https://vpl-api.azure-api.net/echo/resource?param1=sample</code>).

We will then select the <em>Headers</em> tab.  We will add an header with the key <code>Ocp-Apim-Subscription-Key</code> and the value of the subscription key we just copied.  This is how we pass the subscription key to a request.

<img src="/assets/posts/2019/4/tracing-request-in-azure-api-management/headers.png" alt="Headers in Postman" />

If we click send, Postman is going to send the HTTPS request to Azure API Management.

If we then select the <em>Headers</em> in the response:

<img src="/assets/posts/2019/4/tracing-request-in-azure-api-management/response-headers.png" alt="Response headers" />

We can see what API Management responded.  Nothing very exciting, but the request was a success (i.e. 200 OK).

<h2>Activating the Tracing</h2>

Although the call was successful, there is no way to see what happened inside API Management.  We can't know which policy was fired and how they transformed the request.

For that, let's activate tracing.

This is quite easy.  Let's add an header on the request with key <code>Ocp-Apim-Trace</code> and value <code>true</code>.

That's it.

If we send that request now, we should receive a very similar response, except we now have an header <code>Ocp-Apim-Trace-Location</code> in the response:

<img src="/assets/posts/2019/4/tracing-request-in-azure-api-management/response-headers-tracing.png" alt="Response header with tracing" />

The value of that header is a URL pointing to a blob in some blob storage.

<h2>Accessing traces</h2>

Let's copy paste that URL in a browser.

<img src="/assets/posts/2019/4/tracing-request-in-azure-api-management/browser.png" alt="Browser" />

This is a JSON payload with all the tracing.

We can expend it in a JSON editor to more easily read it.

```Javascript
{
  "traceId": "922d3b8d298b4978b990e3ef515925b2",
  "traceEntries": {
    "inbound": [
      {
        "source": "api-inspector",
        "timestamp": "2019-11-12T18:45:18.0140706Z",
        "elapsed": "00:00:00.0002718",
        "data": {
          "request": {
            "method": "GET",
            "url": "https://vpl-api.azure-api.net/echo/resource?param1=sample",
            "headers": [
              {
                "name": "Ocp-Apim-Subscription-Key",
                "value": "f6048eafa32e4bfc9d09eae7d723fb3d"
              },
              {
                "name": "Postman-Token",
                "value": "2569f3ad-83e9-485b-b90d-095a8c03d670"
              },
              {
                "name": "Cache-Control",
                "value": "no-cache"
              },
```

We find the exact same information we were finding in the Portal.

<h2>Summary</h2>

We saw how to use Request Tracing outside of the Azure Portal.

Although the API we used was trivial and had no policy, the same method could be applied to a more complex API.

Adding an HTTP Header is all we need to be returned the tracing information.