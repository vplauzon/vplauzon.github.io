---
title: Accessing Azure Key Vault from within Azure API Management
date: 2019-11-19 03:30:31 -08:00
permalink: /2019/11/19/accessing-azure-key-vault-from-within-azure-api-management/
categories:
- Solution
tags:
- API
- Security
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2019/4/accessing-azure-key-vault-from-within-azure-api-management/photography-of-person-peeking-906018-e1573771994213.jpg" />

Today we look at a common although slightly advanced scenario with API Management:  accessing Azure Key Vault from <a href="https://vincentlauzon.com/2019/07/24/anatomy-of-api-management/">Azure API Management</a>.

In an Enterprise, API Management service are often shared between teams.  This means a lot of people might open it in the Portal and look at it.  It also means that putting secrets in the properties / named values isn't a great idea.

Therefore, it is best practice to put secrets in an Azure Key Vault.

Azure API Management can then use its <a href="https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview">Managed Service Identity</a> to access the secrets from Azure Key Vault.

This is what we're going to look at concretely here.

This article is heavily inspired by a <a href="https://github.com/Azure/api-management-policy-snippets/blob/master/examples/Look%20up%20Key%20Vault%20secret%20using%20Managed%20Service%20Identity.policy.xml">code snippet from Azure API Management</a>.  In general, <a href="https://github.com/Azure/api-management-policy-snippets/blob/master/examples">all their code snippets</a> are worth looking at.

We're going to add a little twist with caching.  Looking for a static secret every time an API is requested would add latency to the requests and incur costs.  So, we're going to show how to cache the secret.  You can have a <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-sample-cache-by-key">refresh on custom caching in Azure API Management here</a>.

As usual, <a href="https://github.com/vplauzon/api-management/tree/master/using-key-vault">code is in GitHub</a>.

<h2>Deploying demo</h2>

First, let's deploy the demo solution:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fapi-management%2Fmaster%2Fusing-key-vault%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

There is only one parameter:  the secret value we want to store.  It has a default value.

We need to make sure to deploy to a region where <a href="https://azure.microsoft.com/en-us/global-infrastructure/services/?products=key-vault,api-management">both Azure API Management and Azure Key Vault</a> are available.

This <a href="https://github.com/vplauzon/api-management/blob/master/using-key-vault/deploy.json">ARM template</a> deploys an API Management service and a Key Vault.  The API Management service is <em>Developer</em> sku and hence incur little cost.

The template typically takes over 30 minutes to deploy...

<h2>Key points</h2>

Let's look at the key points of the solution through the Azure Portal.

The resource group should look like this:

<img src="/assets/posts/2019/4/accessing-azure-key-vault-from-within-azure-api-management/resource-group.png" alt="Resource Group" />

<h3>Managed Identity</h3>

Let's first open the API Management service and look at the <em>Managed Identities</em> pane (under <em>Settings</em>).

<img src="/assets/posts/2019/4/accessing-azure-key-vault-from-within-azure-api-management/man-identity.png" alt="Managed Identity" />

The first thing to notice is the status is <em>On</em>.  This means the service has a <a href="https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview">Managed Service Identity</a>.  We are even given its <em>Object ID</em> within the Azure AD tenant.

Using a managed identity means we do not have to separately create a Service Principal and store its secret somewhere.  API Management Service has its own identity and as we'll see later on, we do not need to see its credentials to acquire tokens with it.

<h3>Key Vault Access Policies</h3>

Let's go to the Access Policies pane of Azure Key Vault (under <em>Settings</em> section):

<img src="/assets/posts/2019/4/accessing-azure-key-vault-from-within-azure-api-management/kv-access-policies.png" alt="Key Vault Access Policies" />

We can see a policy attributed to the actual API Management Service identity.  That policy grants <em>get</em> actions on secrets.

We need this so the API Management can read the secret.

We do not have an access policy of our own so we can't look at the secret.  If we create one, we'll see one secret with the value we passed in parameter.

<h3>Named Values</h3>

Let's go back to the API Management Service and let's look at the <em>Named values</em> pane (under <em>API Management</em> section):

<img src="/assets/posts/2019/4/accessing-azure-key-vault-from-within-azure-api-management/named-values.png" alt="Named Values" />

We see two values.  Those are not secrets.

It is good practice in automation to store variables in named values and reference them in the policies.  This way it is easier to vary the values of those variables in different deployments (e.g. different environments).

<h3>get-secret</h3>

Now, let's look at the APIs:

<img src="/assets/posts/2019/4/accessing-azure-key-vault-from-within-azure-api-management/apis.png" alt="apis" />

Beside the default <em>Echo API</em>, we have a <em>secret-manager</em> API with two operations.  Let's look at the <code>get-secret</code> operation.  Here are its policies:

```xml
<!-- This operation fetches a secret from Key Vault and returns it as payload -->
<policies>
    <inbound>
        <base />
        <!-- Retrieve secret from Key Vault -->
        <send-request
            mode="new"
            response-variable-name="vault-secret"
            timeout="20"
            ignore-error="false">
            <set-url>https://{% raw %} {{vault-name}} {% endraw %}.vault.azure.net/secrets/{% raw %} {{secret-name}} {% endraw %}/?api-version=7.0</set-url>
            <set-method>GET</set-method>
            <authentication-managed-identity
                resource="https://vault.azure.net" />
        </send-request>
    </inbound>
    <backend>
        <!-- Return secret (no back-end service call) -->
        <return-response
            response-variable-name="existing context variable">
            <set-status code="200" />
            <set-body>@(((IResponse)context.Variables["vault-secret"]).Body.As<string>())</set-body>
        </return-response>
    </backend>
    <outbound>
        <base />
    </outbound>
    <on-error>
        <base />
    </on-error>
</policies>
```

This API doesn't call a back-end API (as a typical API).  Nor is it a Mock API.  Instead, it calls an external service (Key Vault) and returns its value.

The Azure Key Vault call is done with the <code>send-request</code> policy.  We notice the configuration:

```xml
<authentication-managed-identity resource="https://vault.azure.net" />
```

This tells the policy to used API Management MSI to acquire a token on the resource / audience https://vault.azure.net.

The <code>url</code> points to Azure Key Vault REST API.

The <code>response-variable-name</code> configuration specifies in which <em>context</em> variable to store the response.

In the <em>backend</em> policies we found a <code>return-response</code> policy:

```xml
<return-response>
    <set-status code="200" />
    <set-body>@(((IResponse)context.Variables["vault-secret"]).Body.As<string>())</set-body>
</return-response>
```

It uses the value stored in a context variable.

We can test that API.  We should get the following response:

```JavaScript
{
  "value": "The secret is 42",
  "contentType": "string",
  "id": "https://kv-mtjlwqhrbyyio-demo.vault.azure.net/secrets/my-secret/bcd494e3c9ab4eff9a265e03e79e1a97",
  "attributes": {
    "enabled": true,
    "created": 1573774008,
    "updated": 1573774008,
    "recoveryLevel": "Purgeable"
  },
  "tags": {}
}
```

<h3>get-cached-secret</h3>

Typically, we don't want to return a secret but use it within a policy.  For instance, we might want to retrieve a username / password to authenticate to a back-end API.

For that reason, we don't want to cache the entire response but the secret itself.  API Management allows both response caching and <a href="https://docs.microsoft.com/en-us/azure/api-management/api-management-sample-cache-by-key">variable caching</a>.

This is what we have done in <code>get-cached-secret</code>

```xml
<!-- This operation caches the secret -->
<policies>
    <inbound>
        <base />
        <!--Look for secret in the cache -->
        <cache-lookup-value key="cached-secret" variable-name="cached-secret" />
        <!-- If API Management doesn’t find it in the cache, fetch it from Key Vault -->
        <choose>
            <when condition="@(!context.Variables.ContainsKey("cached-secret"))">
                <!-- Retrieve secret from Key Vault -->
                <send-request mode="new" response-variable-name="cached-secret" timeout="20" ignore-error="false">
                    <set-url>https://{% raw %} {{vault-name}} {% endraw %}.vault.azure.net/secrets/{% raw %} {{secret-name}} {% endraw %}/?api-version=7.0</set-url>
                    <set-method>GET</set-method>
                    <authentication-managed-identity resource="https://vault.azure.net" />
                </send-request>
                <!-- Store response body in context variable as a string -->
                <set-variable name="cached-secret" value="@(((IResponse)context.Variables["cached-secret"]).Body.As<string>())" />
                <!-- Store result in cache -->
                <cache-store-value key="cached-secret" value="@((string)context.Variables["cached-secret"])" duration="5" />
            </when>
        </choose>
    </inbound>
    <backend>
        <!-- Return secret (no back-end service call) -->
        <return-response response-variable-name="existing context variable">
            <set-status code="200" />
            <set-body>@((string)context.Variables["cached-secret"])</set-body>
        </return-response>
    </backend>
    <outbound>
        <base />
    </outbound>
    <on-error>
        <base />
    </on-error>
</policies>
```

The flow of the logic is:

<ul>
<li>Lookup for a cached item (<code>cache-lookup-value</code> policy)</li>
<li>Test if the cached item exists (<code>choose</code> policy)

<ul>
<li>If it does, keep going</li>
<li>If it doesn't

<ul>
<li>Retrieve it from Key Vault (<code>send-request</code> policy, similar to previous operation)</li>
<li>Set a variable with its value (<code>set-variable</code> policy)</li>
<li>Cache the value (<code>cache-store-value</code> policy)</li>
</ul></li>
</ul></li>
<li>Return the cached value (<code>return-response</code> policy)</li>
</ul>

Although it is a little verbose, the actual logic is quite simple.

We can test the API.  The value is cached for 5 seconds.  We can test that by looking at the tracing and see something like this when the cache is empty (i.e. after 5 seconds of inactivity):

```text
choose (0.017 ms)
{
    "message": "Expression was successfully evaluated.",
    "expression": "!context.Variables.ContainsKey(\"cached-secret\")",
    "value": true
}
```

And something like this when the cache contains the value:

```text
choose (0.013 ms)
{
    "message": "Expression was successfully evaluated.",
    "expression": "!context.Variables.ContainsKey(\"cached-secret\")",
    "value": false
}
```

<h2>Summary</h2>

We've seen how we can easily access a secret from Azure Key Vault within a policy in Azure API Management.

A realistic scenario would be using the secret on a back-end API.

In our case, we simply saw how to return the secret or cache it.

This pattern can help us make our Azure API Management solution more secure by hiding secrets from operators.