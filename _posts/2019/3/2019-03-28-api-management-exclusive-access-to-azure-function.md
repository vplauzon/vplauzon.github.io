---
title: API Management exclusive access to Azure Function
date: 2019-03-28 06:30:58 -04:00
permalink: /2019/03/28/api-management-exclusive-access-to-azure-function/
categories:
- Solution
tags:
- API
- Serverless
---
<img style="float:right;padding-right:20px;" title="From pixabay.com" src="/assets/2019/3/api-management-exclusive-access-to-azure-function/armor-army-ax-226746-e1553699579439.jpg" />

[<strong>Update 05-04-2019</strong>:  Erratum on the original article.  Logic Apps is actually able to perform public IP filering.]

<a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-key-concepts">Azure API Management</a> acts as a front door to your APIs.

Typically, we do not want users / apps to be able to access the underlying APIs directly since that would bypass the API Management policies, e.g. throttling, or even security.

In this article, we'll look at the specific scenario of API Management fronting three types of Azure services:

<ul>
<li><a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-overview">Azure Functions</a> ; what is true for Azure Functions will be true for Azure Web App / Web API too</li>
<li><a href="https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-overview">Azure Logic Apps</a> ; hence we focus on the Logic Apps exposing an HTTP trigger</li>
<li><a href="https://docs.microsoft.com/en-us/azure/cognitive-services/">Azure Cognitive Services</a></li>
<li>VNET-bound Compute (e.g. AKS, App Service Environment, Virtual Machines, etc.)</li>
</ul>

We will look at the different ways we can protect those services from being accessed by anything but the API Management.

The <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-faq#how-can-i-secure-the-connection-between-the-api-management-gateway-and-my-back-end-services">different options are enumerated in the FAQ</a>.  We are going to add one (bearer token) and detail how to use those options.

The right answer for your architecture might be more than one option.  You might opt to build <a href="https://en.wikipedia.org/wiki/Layered_security">Layered security</a> so that if one mechanism fails because of some weakness in your process, another mechanism will take over.  I encourage this as long as it doesn't bring your architecture down by the weight of the mechanisms.

<h2>Public IP filtering (Functions &amp; Logic Apps)</h2>

The low hanging fruit is the public IP filtering.

API Management exposes a stable Virtual IP (VIP) for each region.  Those IPs are used as outbound IPs by the service to contact other services.

There are <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-faq#is-the-api-management-gateway-ip-address-constant-can-i-use-it-in-firewall-rules">some circumstances when those IPs could change</a>.  This basically happen when we delete / modify the instance.

We could therefore use that public IP to <a href="https://docs.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions">restrict access to the underlying App Service</a>.

<strong>PROs</strong>:
* Easy to implement
* Strong access mechanism

<strong>CONs</strong>:
* Coarse grain access

<h2>Private IP filtering (VNET Bound Compute)</h2>

API Management can be bound to a Virtual Network's subnet (one per region).

For VNET bound compute, this could be used to inform an NSG rule blocking everything but the traffic incoming from those subnets.

<strong>PROs</strong>:
* Easy to implement
* Strong access mechanism

<h2>Access keys (Functions, Logic Apps &amp; Cognitive Services)</h2>

Azure Functions, Logic Apps &amp; Cognitive Services have access keys.

We have reviewed the different HTTP authorization levels for Azure Functions in <a href="https://vincentlauzon.com/2017/12/04/azure-functions-http-authorization-levels/">a past article</a>.

Logic Apps also use access keys.  By default, the primary key is used to build a SAS for an HTTP trigger.  But with a little persuasion, <a href="https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-securing-a-logic-app#primary-secondary-key">we can also use the secondary key</a>.  This allows us to rotate the keys without disrupting the service.

Similarly, Cognitive Services also have a primary &amp; secondary key.

Here we need API Management to use some secrets in order to access the services.  Secrets can be <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-howto-properties">stored and managed as named value</a> within API Management.  Key Vault can't be leveraged yet as the integration between the <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-howto-use-managed-service-identity">two services is still limited at the time of this writing</a> (end of March 2019).

<strong>PROs</strong>:
* Relatively easy to implement

<strong>CONs</strong>:
* With many services, lots of keys to manage (amplified when we consider key rotation)
* If key is leaked, service is compromised

<h2>Basic authentication (Functions, Logic Apps &amp; VNET bound compute)</h2>

We can also have API Management sending some secrets clear text within the request, either within the URL or the payload.

This can often be implemented with the help of infrastructure (e.g. IIS).  In many cases though, this would require some customization.  For instance, a Logic App would validate the payload as a first step.

<strong>PROs</strong>:
* Relatively easy to implement

<strong>CONs</strong>:
* With many services, lots of secrets to manage (amplified when we consider secret rotation)
* If secret is leaked or intercepted (e.g. logs), service is compromised
* Requires custom logic

<h2>Mutual authentication with client certificate (Functions &amp; VNET bound compute)</h2>

API Management can <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-howto-mutual-certificates-for-clients">use a certificate to authenticate itself to an API</a>.  Key Vault can be used to <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-howto-use-managed-service-identity#use-the-managed-service-identity-to-access-other-resources">store certificates</a>.

App Service <a href="https://docs.microsoft.com/en-ca/azure/app-service/app-service-web-configure-tls-mutual-auth">online documentation shows how to implement that</a>.  This would work for Azure Functions in particular.

<strong>PROs</strong>:
* Strong access control

<strong>CONs</strong>:
* Requires certificate management
* With many services, lots of certificates to manage (amplified when we consider certificate rotation)
* If certificate is leaked, service is compromised

<h2>Bearer token (Functions, Logic Apps &amp; VNET Bound Compute)</h2>

This is the approach we add to <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-faq#how-can-i-secure-the-connection-between-the-api-management-gateway-and-my-back-end-services">the ones already documented online</a>.

Here we have the proxied service (e.g. Function) be represented as an Azure AD (AAD) Application.  API Management, as a client, will authenticate through that AAD Application and acquire an access token.  It will then pass that token as a bearer token in the request.

In order to do so, we can leverage <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-howto-use-managed-service-identity">API Management Managed Identity</a>.  This can be done with the following policy:

```bash
<authentication-token token-type="managed-service-identity" resource-url="AAD APPLICATION ID" />
```

This policy will acquire a token using the service managed identity.

Custom logic can be implemented for authorization.  For App Service, the ClaimsPrincipal can be used to retrieve principal's identity.  We could then check membership to a group for example.

<strong>PROs</strong>:
* Strong access control
* Secret doesn't get leaked (managed service identity doesn't expose the underlying secrets)

<strong>CONs</strong>:
* Requires configuring AAD Applications for each function (or function app, depending how we choose to implement it)
* Custom logic for authorization

<h2>Summary</h2>

Here is a summary of the different options we have to secure access to different services:

<table>
<thead>
<tr>
  <th></th>
  <th align="center">Functions</th>
  <th align="center">Logic Apps</th>
  <th align="center">Cognitive Services</th>
  <th align="center">VNET Bound Compute</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Public IP filtering</td>
  <td align="center">X</td>
  <td align="center">X</td>
  <td align="center"></td>
  <td align="center"></td>
</tr>
<tr>
  <td>Private IP filtering</td>
  <td align="center"></td>
  <td align="center"></td>
  <td align="center"></td>
  <td align="center">X</td>
</tr>
<tr>
  <td>Access keys</td>
  <td align="center">X</td>
  <td align="center">X</td>
  <td align="center">X</td>
  <td align="center"></td>
</tr>
<tr>
  <td>Basic authentication</td>
  <td align="center">X</td>
  <td align="center">X</td>
  <td align="center"></td>
  <td align="center">X</td>
</tr>
<tr>
  <td>Mutual authentication with client certificate</td>
  <td align="center">X</td>
  <td align="center"></td>
  <td align="center"></td>
  <td align="center">X</td>
</tr>
<tr>
  <td>Bearer token</td>
  <td align="center">X</td>
  <td align="center">X</td>
  <td align="center"></td>
  <td align="center">X</td>
</tr>
</tbody>
</table>

We gave some pros and cons for each method.

As mention in introduction, more than one method can be used at the same time.  For instance, we could implement both a private IP filtering on VNET bound compute in order to block access.  We could then also use a bearer token or a basic authentication to make sure the caller is who we think it is.  This way if the NSG gets broken by some human error, the service isn't wide open.