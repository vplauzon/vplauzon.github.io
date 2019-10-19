---
title:  Deploying an ARM template hierarchy
date:  2019-04-24 06:30:07 -04:00
permalink:  "/2019/04/24/deploying-an-arm-template-hierarchy/"
categories:
- Solution
tags:
- Automation
- DevOps
---
<img style="float:right;padding-right:20px;" title="From pexels.com" src="/assets/2019/4/deploying-an-arm-template-hierarchy/chalk-company-conceptual-533189-e1555953696631.jpg" />

<a href="https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-authoring-templates">ARM templates</a> are a powerful way to deploy Azure resources.

It's a declarative language which express the target state.  It can therefore be used to create or update resources.

An ARM template is a JSON file.  Once a target is big enough it becomes convenient to split the ARM template into multiple files.  This can be a little tricky due to the way ARM templates are processed by Azure Resource Manager (ARM).

In this article, I'll show the typical way to do this, which is by using a storage account and SAS token.

As usual, <a href="https://github.com/vplauzon/devops/tree/master/multiple-templates">code is in GitHub</a>.

<h2>Shortcomings of ARM Template processing</h2>

Deployment of ARM templates is done by using either the Azure Command Line Interface (<a href="https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest">Azure CLI</a>) using <code>az group deployment create</code> or <a href="https://docs.microsoft.com/en-us/powershell/azure/overview?view=azps-1.7.0">Azure PowerShell</a> using <code>New-AzResourceGroupDeployment</code>.

Both those tools leverage the same <a href="https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-template-deploy-rest">REST API</a>.

That API can either take a URI to an ARM Template or the ARM Template content itself, in JSON.  The API doesn't allow to take a bundle of ARM Template files, e.g. a zip file.

There is a mechanism for an ARM template to link to another ARM template.  This is done by deploying a <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.resources/2018-05-01/deployments">Microsoft.Resources/deployments</a> resource.  A key property of that resource is <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.resources/2018-05-01/deployments#TemplateLink">templateLink</a>.

This is basically a public URI.

The reason the REST API works with public URIs is that the deployment is occurring within Azure, like any REST API invocation.  It isn't happening on our laptop or CI/CD where files might be located.

Public URIs are the only thing the REST API has accessed to.

<h2>False friend</h2>

Let's get a <a href="https://en.wikipedia.org/wiki/False_friend">false friend</a> out of the way:  the usage of public URI.

A lot of demos on internet rely on the use of public URI, typically using GitHub.

We are guilty of that, for instance in the deployment of <a href="https://github.com/vplauzon/app-gateway/blob/master/vmss-path-routing-windows/azuredeploy.json">multiple VM Scale Sets exposed by an Azure Application Gateway</a>.

This is a quick trick for demos but doesn't work in the Enterprise world since we need to expose ARM templates publicly.

We could argue that ARM templates do not represent Enterprise IPs.  Although that would be hard to argue in many cases, even worse is the slippery slope where this would lead us.  People often "forget" secrets in ARM templates (which is a bad practice) and having them public would leak those secrets.

In general, it isn't a secure way to deploy resources.

<h2>Solution</h2>

Our solution relies on an Azure Storage Account and <a href="https://docs.microsoft.com/en-us/azure/storage/common/storage-dotnet-shared-access-signature-part-1">SAS tokens</a>.

Files (blobs) will be private.  The use of a Shared Access Signature (SAS) creates a "pass code" to access those blobs.

SAS token can be limited in time which limits the risks related of them being leaked.

So here are the quick steps for our solution:

<img src="/assets/2019/4/deploying-an-arm-template-hierarchy/multi-arms-1.png" alt="Solution" />

<ol>
<li>Create a storage account

<ol>
<li>Create a blob container within the account</li>
<li>Create a SAS token for that container</li>
</ol></li>
<li>Copy the ARM Template files over to that container</li>
<li>Deploy the root template</li>
</ol>

In our sample, we will have a root template that will invoke two other template:  one to create a VNET, the other to create a public IP.

<h3>Create a storage account</h3>

We'll use an ARM template for that since we are on the topic:

<a href="https://raw.githubusercontent.com/vplauzon/devops/master/multiple-templates/deploy-storage.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

The template only has one parameter:  the name of the storage account.  That account needs to be unique throughout Azure since it is used as a domain name.

This creates a storage account with one blob container with private access level.

<h3>Creating SAS token</h3>

Let's create the SAS token.  For that we'll need some scripting.

First, we need to define the name of the storage account we just created in a shell variable:

```bash
storage=<my account name>
```

Then we simply execute the following script:

```bash
expiry=$(date -u -d "45 minutes" '+%Y-%m-%dT%H:%MZ')

sas=$(az storage container generate-sas --account-name $storage -n deploy --https-only --permissions r --expiry $expiry -o tsv)
```

This puts the SAS token inside the variable <em>sas</em>.

Here we use an expiry date 45 minutes in the future.  This is to allow us to complete the sample.  In a CI/CD, that window could be shorten considerably.

<h3>Copying ARM Templates</h3>

Before copying files, we'll delete existing blobs in case there are:

```bash
az storage blob list --account-name $storage -c deploy --query "[].name" -o tsv | \
 xargs -P 5 -I blobName az storage blob delete --account-name $storage -c deploy -n blobName
```

Not the fastest way to delete many blobs, but it works.

Now we can copy the files.  Assuming we are in the <a href="https://github.com/vplauzon/devops/tree/master/multiple-templates/templates">templates folder</a> of the cloned GitHub, we can copy the arm templates there:

```bash
find * -type f | \
 xargs -P 5 -I blobName az storage blob upload --account-name $storage -c deploy --name blobName -f blobName
```

That command preserves the file hierarchy.

<h3>Deploying ARM Templates</h3>

We can now deploy the root template.  We need to pass the SAS token as parameter so it can be used to invoke the other templates.  We also need to pass the blob prefixes.

Let's first define the resource group we want to deploy in.  It needs to already exist since we won't create it.

```bash
group=<my resource group name>
```

Then we need to find the blob prefix:

```bash
sample=$(az storage blob url --account-name $storage -c deploy -n sample -o tsv)
blobPrefix=${sample%sample}
```

```bash
az group deployment create -n "deploy-$(uuidgen)" -g $group \
    --template-uri "${blobPrefix}root.json?$sas" \
    --parameters \
    sas=$sas \
    blobPrefix=$blobPrefix
```

This will deploy our VNET &amp; Public IP.

We can see by looking at <a href="https://github.com/vplauzon/devops/blob/master/multiple-templates/templates/root.json">root.json</a> that we can even pass parameters to deployments.

```JavaScript
{
    "type": "Microsoft.Resources/deployments",
    "apiVersion": "2018-05-01",
    "name": "vnet",
    "properties": {
        "templateLink": {
            "uri": "[concat(parameters('blobPrefix'), 'sub/vnet.json?', parameters('sas'))]"
        },
        "parameters": {
            "vnet-name": {
                "value": "myvnet"
            }
        },
        "mode": "Incremental"
    }
},
```

We could also use the outputs of a deployment although we do not do it here.

<h2>Summary</h2>

ARM templates are great at deployment resources in Azure.  We do need to work a bit in order to structure our templates in many files though.

The technique we showed here uses Azure Storage Account and short-lived SAS token.  This is secure way to use multiple ARM templates.

The different scripts provided here can easily be hooked up in a Continuous Integration / Continuous Delivery (CI/CD, e.g. Azure DevOps) system.