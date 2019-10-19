---
title:  Azure Dev Ops CI / CD pipelines with AKS - Lessons learned
date:  2018-10-17 10:30:06 +00:00
permalink:  "/2018/10/17/azure-dev-ops-ci-cd-pipelines-with-aks-lessons-learned/"
categories:
- Solution
tags:
- Automation
- Containers
- DevOps
---
<img style="float:right;padding-right:20px;" title="From Pexels" src="https://vincentlauzon.files.wordpress.com/2018/10/business-close-up-energy-191648-e1539692591199.jpg" />

I have this personal project where I have a swag of micro services collaborating to serve different web applications.

I started to work on the Continuous Integration / Continuous Deployment (CI / CD) using <a href="https://docs.microsoft.com/en-us/azure/devops/user-guide/what-is-azure-devops-services">Azure DevOps</a>.

I did toy around those areas before.  But this was really a <em>rubber hits the road</em> experience for me.  A bunch of tiny issues raised their head and I learn quite a bit by taming them one by one.

I though I would share the experience.

So far, I really only automated the deployment of <a href="https://vincentlauzon.com/tag/containers/">Azure Kubernetes Services</a>(AKS) itself.  Deployment of applications is a work in progress.  Therefore, this is going to be a short article.

<h2>Azure DevOps</h2>

<a href="https://docs.microsoft.com/en-us/azure/devops/user-guide/what-is-azure-devops-services">Azure DevOps</a> used to be known as Visual Studio Team Services (VSTS).

We are <strong>SO HAPPY</strong> that service got rebranded with a client-technology neutral name.

So many people we spoke with were convinced that VSTS was somehow an extension of Visual Studio and solely a .NET platform.  It isn't.  It integrates with many more development platforms.

Here we discuss only the CI / CD capabilities of Azure DevOps.  We use GitHub for repository and integrate it with Azure DevOps.

<h2>Environments</h2>

<img style="float:left;padding-right:20px;" title="From Pexels" src="https://vincentlauzon.files.wordpress.com/2018/10/art-ball-ball-shaped-235615-e1539706329190.jpg" />

We have two environments:  Dev &amp; Prod.

We test stuff in Dev, iterate there and then swing it to Prod.

Dev is an ephemeral environment.  We destroy it often for cost management reason.

On the other hand, Dev is an accurate replica of Production.  It isn't a smaller cluster with cheaper VMs with half features turned off.

This gives us great confidence that when something works in Dev, it should work in Production.  Here we take advantage of Cloud Elasticity.  So often we've seen problems with on-premise production systems that were not caught earlier because nothing looks like the prod for cost reasons.  Here we do bake cost management in but do not sacrifice accuracy.

Our release pipeline looks like this:

<img src="https://vincentlauzon.files.wordpress.com/2018/10/release-pipeline.png" alt="Release Pipeline" />

We have three jobs:

<table>
<thead>
<tr>
  <th>Job</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Dev</td>
  <td>Deploys the dev cluster</td>
</tr>
<tr>
  <td>Prod</td>
  <td>Deploys the prod cluster</td>
</tr>
<tr>
  <td>Destroy-Dev-Manually</td>
  <td>Destroys the dev cluster</td>
</tr>
</tbody>
</table>

We use a job to destroy the cluster.  In theory we would want to touch environments only through CI / CD and that's part of that.

<h2>Build phase for a cluster</h2>

What does a build mean when the output is an AKS cluster?  There is no code, is it?

There are scripts (including ARM templates).  The build phase is simply about publishing those scripts as an artefact.  This is what is picked up by the release pipeline.

<h2>Kubenet plugin</h2>

We use the Kubenet plugin within AKS with a separately provisioned VNET.

As we mentioned in a <a href="https://vincentlauzon.com/2018/09/06/aks-with-kubenet-vs-azure-networking-plug-in/">previous article</a>, this gives us a few advantages, mainly it reduces the pressure on private IP management.

Currently, ARM template deployment for Kubenet plugin has a bug.  It doesn't attach a routing table to our VNET.

We fix that by running an Azure CLI script that does attach that routing table.

We then discovered an ugly problem.  Each time we redeploy, the routing table gets disconnected during the ARM template deployment until the CLI script re-attaches it.  This means the cluster is dysfunctional for a few minutes.

We are going to do some work to perform the attachment within the ARM template so that downtime doesn't occur.

This is the kind of problems that can be caught only by doing real work and is why we embarked on this project in the first place.

<h2>Azure Key Vault</h2>

As we argued <a href="https://vincentlauzon.com/2015/02/03/azure-key-vault/">many times</a>, Azure Key Vault isn't good only to store / retrieve secrets in a secure manner.  It's a great tool to centralize the management of secrets.

For instance, we store service principal's credentials in Azure Key Vault.  It is then very easy to rotate secrets.

But we went further.  We store DNS prefix in Azure Key Vault.  The day we want to change it, we have one place to change it.

It also allows us to remove deployment specific information from GitHub.

We use Azure CLI to <a href="https://github.com/vplauzon/shared-infra/blob/master/secrets.sh">store secrets</a>, e.g.

```bash
az keyvault secret set --vault-name $vault --name dev-shared-infra-ssh-public-key --value <VALUE>
```/code]

and we retrieve those in the ARM templates as:

```JavaScript
            "name": "Cluster",
            "type": "Microsoft.Resources/deployments",
            "apiVersion": "2018-05-01",
            "properties": {
                "mode": "Incremental",
                "templateLink": {
                    "uri": "[variables('AKS Cluster Template URL')]",
                    "contentVersion": "1.0.0.0"
                },
                "parameters": {
                    "ssh Public Key": {
                        "reference": {
                            "keyVault": {
                                "id": "[parameters('vault-id')]"
                            },
                            "secretName": "[concat(parameters('environment'),'-shared-infra-ssh-public-key')]"
                        }
                    },

```ult-id&#039;)]&quot;
                            },
                            &quot;secretName&quot;: &quot;[concat(parameters(&#039;environment&#039;),&#039;-shared-infra-ssh-public-key&#039;)]&quot;
                        }
                    },

[/code]

This requires us to declare a deployment resource and to split our deployment in multiple ARM template files.  In GitHub this is trivial since we use public repos.  With a private repo, it would add some complexity to point to a public URI.

Since our deployment requires the Azure Key Vault to be populated, we set it up separately in a different resource group.

<h3>Access Rights in Key Vault</h3>

The user / service principal access the Key Vault <a href="https://docs.microsoft.com/en-us/azure/key-vault/tutorial-web-application-keyvault#grant-rights-to-the-application-identity">needs some access rights</a>.

In our case, the user running the ARM template is a Service Principal posing for Azure DevOps.

We tried to give minimum privilege to that Service Principal but since we wanted it to be able to create the resource groups, we ended up to a subscription-wide right.

By default Azure DevOps gives those Service Principal <em>contributor</em> role to the subscription.  This works with Azure Vault but is absolutely against the <a href="https://en.wikipedia.org/wiki/Principle_of_least_privilege">Principle of Least Privilege</a>.

We have some work items planned to address this as well.

<h2>Dev Ops Variables</h2>

Everywhere we have something that varies by environment, we use Azure Dev Ops <em>variables</em>.  They are easy to vary per <em>stage</em> (i.e. environments) and easy to manage.

<img src="https://vincentlauzon.files.wordpress.com/2018/10/release-variables.png" alt="Release Variables" />

<h2>Summary</h2>

This was a short overview of some lessons learned doing some Azure DevOps with AKS.

So far, we only deploy AKS, so it's pretty simple although we had to lay out the foundation for secret management.

In the short term we'll deploy our first Kubernetes service to the cluster with a separate pipeline.