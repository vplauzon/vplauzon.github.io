---
title:  Accessing Azure Key Vault using Managed Service Identity Logic Apps
date:  2019-02-13 11:30:41 +00:00
permalink:  "/2019/02/13/accessing-azure-key-vault-using-managed-service-identity-logic-apps/"
categories:
- Solution
tags:
- API
- Identity
- Integration
- Security
- Serverless
---
<img style="float:left;padding-right:20px;" title="From Pexels" src="https://vincentlauzon.files.wordpress.com/2018/12/safe-913452_640-e1544113123159.jpg" />

<a href="https://vincentlauzon.com/2015/07/09/azure-key-vault-is-now-generally-available/">Azure Key Vault</a> is a great service to manage secrets, keys &amp; certificates.

It uses <a href="https://vincentlauzon.com/2015/07/09/azure-key-vault-is-now-generally-available/">RBAC to control access</a>.  Like all access control system, there is a chain of access.  For instance, my user account has access to the vault:  this means if my account's credentials get leaked, the access to the vault is compromised.

Often this chain has its weakest link at the origin.  People will put service principal's secret in an application configuration.  This can then be leaked by someone having access to the application configuration.

Azure solves this secret bootstrapping problem quite elegantly with <a href="https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview">Managed Service Identity</a> (MSI).

An MSI is an identity bound to a service.  It is created for the service and its credentials are managed (e.g. renewed) by Azure.  The credentials are never divulged.  Only tokens are dilvulged.  The identity is terminated when the service is deleted.

There are currently (end of 2018) no integration between Azure Key Vault and Azure Logic App.

I thought I would get two birds with one stone by demonstrating how to use <a href="https://docs.microsoft.com/en-us/rest/api/keyvault">Azure Key Vault REST API</a> with Azure Logic Apps using MSI.

I based the Logic App / Key Vault integration on the <a href="https://devkimchi.com/2018/10/24/accessing-key-vault-from-logic-apps-with-managed-identity/">great article from DevKimchi</a>.  What I've added is the automation (ARM) &amp; MSI.

As usual the <a href="https://github.com/vplauzon/logic-apps/tree/master/keyvault-integration">code is on GitHub</a>.

<h2>ARM Template</h2>

We can deploy the demo ARM template with the following button:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Flogic-apps%2Fmaster%2Fkeyvault-integration%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

This should quickly (seconds) deploy 3 resources:

<img src="https://vincentlauzon.files.wordpress.com/2018/12/3-resources.png" alt="3 resources" />

<h2>Key vault</h2>

By default we do not have access to the key vault.  This is a little unintuitive since we created it.

In order to give ourselves access, we need to add an access policies.

<img src="https://vincentlauzon.files.wordpress.com/2018/12/access-policies.png" alt="Access Policies" />

We see there exists one already for the <em>get-secret-app</em> Service Principal.  This is the Manage Service Identity (MSI) of the <em>get-secret-app</em> Logic App.

This was done by the ARM template

```javascript
"accessPolicies": [
    {
    "tenantId": "[reference(resourceId('Microsoft.Logic/workflows', variables('Get Secret App Name')), '2017-07-01', 'Full').identity.tenantId]",
    "objectId": "[reference(resourceId('Microsoft.Logic/workflows', variables('Get Secret App Name')), '2017-07-01', 'Full').identity.principalId]",
    "permissions": {
        "secrets": [
        "get"
        ]
    }
    }
]
```9;Full&#039;).identity.principalId]&quot;,
    &quot;permissions&quot;: {
        &quot;secrets&quot;: [
        &quot;get&quot;
        ]
    }
    }
]
[/code]

That policy gives the <em>get</em> access on <em>secrets</em> only.  This is the minimal privilege needed for the application since it will only access a secret.

We can add our own user account by adding a policy and giving it maximum permission.  <strong>DO NOT FORGET TO SAVE POLICIES AFTER.</strong>

We should then be able to see the secrets.

<img src="https://vincentlauzon.files.wordpress.com/2018/12/secrets.png" alt="secrets" />

The template created only one secret:

```javascript
{
    "name": "[variables('Secret Name')]",
    "type": "secrets",
    "apiVersion": "2018-02-14",
    "tags": {},
    "dependsOn": [
        "[resourceId('Microsoft.KeyVault/vaults', parameters('Vault Name'))]"
    ],
    "properties": {
        "value": "[variables('Secret Value')]",
        "contentType": "",
        "attributes": {
            "enabled": "true"
        }
    }
}
```;: &quot;[variables(&#039;Secret Value&#039;)]&quot;,
        &quot;contentType&quot;: &quot;&quot;,
        &quot;attributes&quot;: {
            &quot;enabled&quot;: &quot;true&quot;
        }
    }
}
[/code]

<h2>Demo App</h2>

The demo app really is a wrapper on the <em>get-secret-app</em>.  The idea was to make <em>get-secret-app</em> parameterizable by the name of the secret.  This makes it reusable.

<img src="https://vincentlauzon.files.wordpress.com/2018/12/demo-app.png" alt="Demo app" />

If we run the app, it should be all green with the response task returning <a href="https://en.wikipedia.org/wiki/42_(number)#The_Hitchhiker's_Guide_to_the_Galaxy">the answer</a>.

<img src="https://vincentlauzon.files.wordpress.com/2018/12/the-answer.png" alt="The Answer" />

This is the value of the <em>my-secret</em> secret in the Key Vault.

This Logic App doesn't have a Managed Service Identity (MSI) as it doesn't access privilege service.  It simply calls on an app that does.  This shows that we can centralize access and give it least privilege.

<h2>Get Secret App</h2>

This Logic App is a little more sophisticated although quite straightforward.

<img src="https://vincentlauzon.files.wordpress.com/2018/12/get-secret-app.png" alt="Get Secret App" />

It uses two REST API.

<ol>
<li>It gets the current version of the secret</li>
<li>It parses the result</li>
<li>It fetches the value of the secret for that version</li>
<li>It parses the result</li>
<li>It returns the value in the HTTP response</li>
</ol>

There is an API to list <a href="https://docs.microsoft.com/en-us/rest/api/keyvault/getsecretversions/getsecretversions">all the versions of a secret</a>.  Unfortunately, it isn't trivial to find the current version with that list.  We instead used an undocumented API:

```text
GET {vaultBaseUrl}/secrets/{secret-name}?api-version=7.0
```

which returns the current version.

To get the value of the secret's version, we used the <a href="https://docs.microsoft.com/en-us/rest/api/keyvault/getsecret/getsecret">get secret API</a>.

The trick to use REST API is of course to authenticate with it.  This is done by specifying the authentication section in the ARM Template:

```javascript
"get-current-version": {
    "inputs": {
        "authentication": {
            "audience": "https://vault.azure.net",
            "type": "ManagedServiceIdentity"
        },
        "method": "GET",
        "uri": "https://@{parameters('vault-name')}.vault.azure.net/secrets/@{triggerBody()['secret']}?api-version=7.0"
    },
    "runAfter": {},
    "type": "Http"
}
```ure.net/secrets/@{triggerBody()[&#039;secret&#039;]}?api-version=7.0&quot;
    },
    &quot;runAfter&quot;: {},
    &quot;type&quot;: &quot;Http&quot;
}
[/code]

This can also be seen in the HTTP tasks by <em>showing advanced options</em>:

<img src="https://vincentlauzon.files.wordpress.com/2018/12/authentication.png" alt="Authentication in Portal" />

As <a href="https://devkimchi.com/2018/10/24/accessing-key-vault-from-logic-apps-with-managed-identity/">DevKimchi</a> stretches out, the audience needs to be precise.  It needs to be https://vault.azure.net.  It shouldn't contain a trailing slash or capital letters.

Using this authentication means App Logics uses its Managed Service Identity (MSI) to access the REST API.  As mentioned earlier, no credentials are shown here.

<h2>Summary</h2>

I hope this was useful to show how we can:

<ol>
<li>Integrate Azure Key Vault with Logic Apps despite no integration exists today (end of 2018)</li>
<li>Use Managed Service Identity (MSI) to securely access the REST API</li>
</ol>

The combination of MSI with Logic Apps makes it very easy to leverage Azure REST APIs.  It becomes comparable to using integration tasks.