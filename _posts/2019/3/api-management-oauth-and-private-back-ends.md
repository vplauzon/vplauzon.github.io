---
title: API Management - OAuth and private back-ends
date: 2019-07-31 03:30:43 -07:00
permalink: /2019/07/31/api-management-oauth-and-private-back-ends/
categories:
- Solution
tags:
- API
- Automation
- Security
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2019/3/api-management-oauth-and-private-back-ends/access-close-up-door-792034-e1562792597181.jpg" />

<a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-key-concepts">Azure API Management</a> is a fully managed <a href="https://www.quora.com/What-is-an-API-gateway">API Gateway</a> service.

In my <a href="http://vincentlauzon.com/2019/07/24/anatomy-of-api-management/">last article</a> we looked at the anatomy of the service.  Today I wanted to demonstrate how to use OAuth with JWT token to protect an API Front End.  I also wanted to show how we can access backend APIs on private networks.

There are a few other interesting bits:

<ul>
<li>How to transform a API with HTTP-GET &amp; query string to an HTTP-POST &amp; JSON body</li>
<li>How to have an API supporting OAuth/JWT when access through a product and just plain-subscription when access through another</li>
<li>How to implement a simple screen-scrap within API Management</li>
<li>How to lock down Logic App to only accept connections from API Management</li>
</ul>

Probably the biggest contribution of this article is to show how to do this all with an ARM template.  ARM template doesn't only allow to quickly build a demo environment, but it enables Dev-Ops.  API Management has a notoriously complicated ARM model, but with time and patience and the help of <a href="https://github.com/Azure/azure-api-management-devops-resource-kit">this DevOps resource kit</a>, you too can make it.

Why would we want to use OAuth / JWT to protect our API?  By default, an API in API Management is protected using a subscription key.  This is good but it can be leaked.  A JWT token is short lived and hence is a little stronger.  If we use Managed Service Identity (MSI) in consumer, it is trivial to acquire a JWT and impossible to leak the secret (certificate) of the MSI.  So the solution becomes much more secure.

As usual, the code is in <a href="https://github.com/vplauzon/api-management/tree/master/private-public">GitHub</a>.

<h2>Sample solution</h2>

Here is the solution we are going to build:

<img src="/assets/posts/2019/3/api-management-oauth-and-private-back-ends/sample-1.png" alt="Sample Solution" />

We have an API Management service in the middle.  It is integrated to a VNET in external mode.  Since it is part of a VNET, it can communicate with other VNET-bound service.  The diagram shows a private IP ; it isn't a service private VIP as it is deployed in external mode.  Rather this represents the private IP of whatever VM happened to communicate with a private service.

The private service is implemented using an <a href="https://vincentlauzon.com/2018/04/26/azure-container-instance-getting-started/">Azure Container Instance</a> for pure convenience:  it is quick and simple to deploy.

The public service is implemented with a Logic App, because it's simple to implement and monitor.

The public consumer also is implemented with a Logic App for similar reasons.

We can easily deploy the solution:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fapi-management%2Fmaster%2Fprivate-public%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

The <a href="https://github.com/vplauzon/api-management/blob/master/private-public/deploy.json">ARM template</a> has 4 parameters:

<table>
<thead>
<tr>
  <th>Parameter</th>
  <th align="center">Mandatory</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>organizationName</td>
  <td align="center">X</td>
  <td>Name of the organisation for API Management.  This is also used for the name of the service.</td>
</tr>
<tr>
  <td>adminEmail</td>
  <td align="center">X</td>
  <td>Email for the admin</td>
</tr>
<tr>
  <td>tenantName</td>
  <td align="center">X</td>
  <td>Name of the Azure AD tenant (related to following parameter)</td>
</tr>
<tr>
  <td>appId</td>
  <td align="center">X</td>
  <td>Azure AD Application ID ; this application is used to authenticate API users</td>
</tr>
</tbody>
</table>

As usual, to author the ARM template, we looked at the <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.network/2019-04-01/frontdoors">online documentation</a>, reverse engineered a deployment made from the portal, checked out some <a href="https://azure.microsoft.com/en-ca/resources/templates/?term=front+door&amp;pageNumber=1">Azure Quickstart Templates</a> and use our imagination.

<h2>Resources</h2>

Once we've deployed the ARM Template, we can take a quick look at the resources in the Portal:

<h3>Virtual Network</h3>

We can see we have 2 subnets.  One for the API Management VMs and one for the private service.  The latter is delegated to the Azure Container Instance (ACI)service.  This is required to deploy an <a href="https://docs.microsoft.com/en-us/azure/container-instances/container-instances-vnet">ACI inside a subnet</a>.

<img src="/assets/posts/2019/3/api-management-oauth-and-private-back-ends/vnet.png" alt="subnets" />

<h3>Azure Container Instance</h3>

Nothing much to say about the private service.  We can see the container image is from Docker Hub:

<img src="/assets/posts/2019/3/api-management-oauth-and-private-back-ends/container-1.png" alt="Container image" />

We are basically using the same image we've built in the <a href="https://vincentlauzon.com/2018/04/24/getting-started-with-docker-in-azure/">Docker Getting Started</a> which is basically a Python Flask <em>Hello World</em>.

This is the service we are going to screen scrap.

<h3>public-consumer-subscription</h3>

This service calls an API Management front end using a subscription key.

<h3>public-consumer-token</h3>

This service calls an API Management front end using a subscription key and a JWT token.

This is done using a Managed Service Identity (MSI) in Logic App.

<h3>public-service</h3>

This is the public service.  It's a simple HTTP-post service expecting a JSON body.

If we try to test the app, it would fail.  The reason is that we locked down the app to accept request only from our instance of API Management:

<img src="/assets/posts/2019/3/api-management-oauth-and-private-back-ends/access-control.png" alt="Access Control" />

(A /32 means a single IP)

We can do that because the outbound public IP of an API Management Service is static (it doesn't change).  This is explained in the <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-faq#how-can-i-secure-the-connection-between-the-api-management-gateway-and-my-back-end-services">FAQ</a>.

<h2>APIs</h2>

Let's look at the APIs in API Management:

<img src="/assets/posts/2019/3/api-management-oauth-and-private-back-ends/apis.png" alt="APIs" />

The <em>Echo API</em> comes as a sample with each API Management service and can be safely deleted.

The <em>one-api</em> is the one we deployed.  It has three operations.

<h3>public</h3>

The public operation maps to the <em>public-service</em> Logic App.

It is configured as an HTTP-get taking two query string parameters.  The transformation occurs in the inbound policies:

```xml
<inbound>
    <base />
    <set-backend-service base-url="{% raw %} {{public-service-url}} {% endraw %}" />
    <set-body>@{
        var body=new
        {
            intro=context.Request.OriginalUrl.Query["intro"].First(),
            number=int.Parse(context.Request.Url.Query["number"].First())
        };

        return JObject.FromObject(body).ToString();
    }</set-body>
    <rewrite-uri template="{% raw %} {{public-service-query-string}} {% endraw %}" copy-unmatched-params="false" />
    <set-method>POST</set-method>
    <set-header name="Content-Type" exists-action="override">
        <value>application/json</value>
    </set-header>
</inbound>
```

A couple of things to say about those policies:

<ul>
<li>We store the backend-url in a named value, hence the double curly-braces.  This is a good practice for two reasons:

<ul>
<li>It allows us to simplify the ARM template and alternating parameters between environments</li>
<li>It allows us to modify the policies in the portal, then export the ARM template and copy-paste the policy since it doesn't contain any hard-coded values</li>
</ul></li>
<li>The <em>set-body</em> policy is where we pick the HTTP-get query string parameter and serialized them in a JSON body</li>
<li>We add the Logic App query string containing its SAS token in a <em>rewrite-uri</em> policy ; again putting the query string as a named value facilitate the eventual rotation of secrets</li>
<li>We override the HTTP method to POST with a <em>set-method</em> policy</li>
<li>We forces the content-type to be of type <em>application/json</em> ; this is required for Logic Apps to interpret the body correctly</li>
</ul>

With only 19 lines of code we were able to transform the API front the frontend to the backend.

We can test the operation and get the simple result.

<h3>private-raw</h3>

This operation simply returns the response from the container.  Nothing fancy here:

```xml
<inbound>
    <base />
    <set-backend-service base-url="{% raw %} {{private-service-url}} {% endraw %}" />
    <rewrite-uri template="/" copy-unmatched-params="false" />
</inbound>
```

If we test the operation and get a result similar to:

```text
<h3>Hello World!</h3><b>Hostname:</b> wk-caas-5fcd43c10fa6404e87ca36b291c59013-4dda47657e18158b8ed3d7<br/><b>Visits:</b> undefined
```

The string starting with <em>wk-caas-5f</em>...  is the container ID.  This one will vary each time the ACI is deployed.

<h3>private-select</h3>

Here we do some screen scraping.  We used the same back-end service, i.e. the Azure Container Instance, but we post-process its response:

```xml
<outbound>
    <base />
    <set-body>@{
    var raw=context.Response.Body.As<string>(true);
    var startIndex = raw.IndexOf("</b>") + 4;
    var endIndex = raw.IndexOf("<br/>");
    var host = raw.Substring(startIndex, endIndex - startIndex).Trim();
    var response = new { hostName = host };

    return JObject.FromObject(response).ToString();
    }</set-body>
</outbound>
```

The C# code might look a little cryptic but basically, we do a couple of string manipulation to extract the container ID and return it in a JSON response.  If we test it:

```JavaScript
{
  "hostName": "wk-caas-5fcd43c10fa6404e87ca36b291c59013-4dda47657e18158b8ed3d7"
}
```

Here we can see how we can easily transform APIs again.

<h2>Products</h2>

Now if we look at the products, we see the standard Starter &amp; Unlimited, but we also see two custom ones:

<img src="/assets/posts/2019/3/api-management-oauth-and-private-back-ends/products.png" alt="products" />

<em>Subscription based</em> product is pretty vanilla.  The <em>Token based</em> one is interesting.  If we look at its policies:

```xml
<inbound>
    <base />
    <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized. Access token is missing or invalid." output-token-variable-name="jwt">
        <openid-config url="https://login.microsoftonline.com/{% raw %} {{tenant-name}} {% endraw %}.onmicrosoft.com/.well-known/openid-configuration" />
        <audiences>
            <audience>{% raw %} {{app-id}} {% endraw %}</audience>
        </audiences>
    </validate-jwt>
    <set-header name="Authorization" exists-action="delete" />
</inbound>
```

So here we do the JWT token validation at the product level.  This means that every operation under every API belonging to that product will have this validation.

Shout out to <a href="https://www.bruttin.com/">Sacha Bruttin</a> for his <a href="https://www.bruttin.com/2017/06/16/secure-logicapp-with-apim.html">nice article</a> which explains why we need the last line!  The incoming requests will have an Authorization header which gets validated for JWT token.  But if we don't delete that header, it will be passed to Logic Apps (the backend API) which will fail with it.  Hence the <em>set-header</em> policy deleting that header at the end.

Now the <em>one-api</em> API belongs to the two products:  one requiring a JWT, one not requiring it.  Products &amp; API have a many-to-many relationship and here we exploit that for demo purposes.

If we go back to test the public operation but we explicitly choose the product as <em>Token based</em>:

<img src="/assets/posts/2019/3/api-management-oauth-and-private-back-ends/test-api-without-token.png" alt="Testing API without token" />

we will hit a failure:

```text
HTTP/1.1 401 Unauthorized

content-length: 85
content-type: application/json
date: Fri, 12 Jul 2019 22:08:44 GMT
ocp-apim-trace-location: https://apimgmtstcnmes4lawzbtjoj.blob.core.windows.net/apiinspectorcontainer/pt8ZzbIWYyFjQG3dBlRRgg2-2?sv=2018-03-28&sr=b&sig=%2FnJUrpsZ85J3a9RvZmhAGAQ0mCQ43ZfV6ek46xGjCIU%3D&se=2019-07-13T22%3A08%3A45Z&sp=r&traceId=af662f0a7cd44949b15e61fe4f828000
vary: Origin
{
    "statusCode": 401,
    "message": "Unauthorized. Access token is missing or invalid."
}
```

That's because the testing UI doesn't send JWT token along with the request.

We can test that API with JWT token by using the <em>public-consumer-token</em> Logic App which does send a JWT token by using its Managed Service Identity (MSI).

<h2>Summary</h2>

We did cover a lot of ground here.

The main points to get across were:

<ul>
<li>Having public &amp; private backends</li>
<li>Locking down public backends so we can't bypass the API Management</li>
<li>Using OAuth / JWT as an authentication method</li>
</ul>