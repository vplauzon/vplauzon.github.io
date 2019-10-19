---
title:  Using Azure DevOps REST API to start multiple releases
date:  2018-12-05 11:30:04 +00:00
permalink:  "/2018/12/05/using-azure-devops-rest-api-to-start-multiple-releases/"
categories:
- Solution
tags:
- API
- Automation
- DevOps
---
<img style="float:left;padding-right:20px;" title="From Pexels" src="https://vincentlauzon.files.wordpress.com/2018/11/architecture-building-construction-220885-e1543604573116.jpg" />

Azure DevOps CI / CD (i.e. Build / Release) mechanism is very valuable to me.  It makes things reproduceable &amp; robust.  It allows me to change whatever I want since I have this constant safety net underneath.

For simple projects, having a build and release is fine.  With micro-services I adopt the pattern of one service / one repo / one CI/CD.

That is great until we consider shared infrastructure.  If many services share an infrastructure (e.g. AKS Cluster, App Service Plan, etc.), which one's release should deploy the shared service?  I considered having each of them doing so but finally adopted the pattern of having a separate repo / CI/CD for the shared infrastructure.  I now need to cascade releases:  shared infrastructure first, then the "real" services.

That's not too bad to sequence it since it's all automated.  But...  I'm cheap and I delete my "dev" environment all the time.  So, when I need to reconstruct it, I need to release the shared infrastructure then each services.  This is when it gets ugly to do it with Azure DevOps UI.

In this article I'm going to show how to use Azure DevOps REST API to do this.  This is going to be solution-agnostic.  You could implement it with a console-app running on your laptop, a container in Azure, etc.  .

In the next article, I'm going to show how to implement it using <a href="https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-overview">Azure Logic Apps</a>.

We are going to stay simple.  I'm going to target the scenario of doing a release on a project, waiting for it to succeed and then releasing another project.  There are many more scenarios with approvals and conditions, etc.  , but here we're going to look at the basics.  You can use your imagination to land your own scenario.

<h2>Fundamental of APIs</h2>

Azure DevOps has a collection of REST APIs.  There is an API per entity, e.g. Build, Release, Git, Work Item, etc.  .

As the <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/?view=azure-devops-rest-5.0">online documentation states</a>, APIs requires use to know:

<ul>
<li>Our organisation:  that's the <em>highest namespace</em> in DevOps.  When we look at the main dashboard, we land on <code>https://dev.azure.com/</code>.</li>
<li>Our project:  this is the name of the devops project.  Again, when we look at the project's dashboard, we land on <code>https://dev.azure.com//</code>.</li>
</ul>

We also need to authenticate.  But that's important, so let's do an entire sub section about that.

<h2>Authentication</h2>

There are <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/?view=azure-devops-rest-5.0#authenticate">many ways to authenticate against Azure DevOps</a>.

Typically, a user authenticates through an Azure AD application.  The application then performs actions <em>on behalf</em> of the user.

In our case, it makes more sense to have actions performed by <em>the system</em>.  Azure AD Service Principal aren't supported in Azure DevOps.  Instead, there is a concept of <a href="https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=vsts">Personal Access Tokens</a> (PAT).

<h3>PAT fundamentals</h3>

A PAT is a token we can directly pass to requests.  We do not need to authenticate using that token to receive a bearer token.

PAT can be given <em>Full access</em> (useful to start) or <em>custom</em> scope.  We recommend using a custom scope here.  As always, we apply the <a href="https://en.wikipedia.org/wiki/Principle_of_least_privilege">Principle of least privilege</a> to limit the attack surface and the magnitude of the risk should the secret be leaked.

For our scenario, a token giving access to read / write / execute of releases is enough:

<img src="https://vincentlauzon.files.wordpress.com/2018/11/releasescope.png" alt="Release scope" />

Unfortunately, at the time of this writing (end of November 2018), there isn't a way to limit the scope per project.

We can set expiration dates to PATs and revoke them shall they be compromised.

It is important to note that a token can be readily used without any user authenticating.  It is therefore important to <em>handle the token with care</em>.  Ideally, <a href="https://vincentlauzon.com/2015/07/09/azure-key-vault-is-now-generally-available/">Azure Key Vault</a> should be used so the secret isn't expose to users.

Unfortunately, at the time of this writing (end of November 2018), there is an <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/tokenadministration/token%20revocations/revoke%20authorizations?view=azure-devops-rest-5.0">API for revoking tokens</a> but none to create one (to automatically rotate PATs).

<h3>Using a PAT to authenticate</h3>

Although using PATs is simple, there are caveats that can easily incur some wasted time.

PAT are using for basic HTTPS authentication.  So, they are passed <em>clear text</em> over HTTPS connection.

Well...  their base-64 representation is passed clear text.

Actually...  An important detail is that a colon (i.e. <strong>:</strong>) needs to be prepended to the PAT before its base-64 representation be calculated.

This is because typically we use the pair <code>USER:SECRET</code>.  Here <code>USER</code> is empty, hence <code>:SECRET</code>.

To be clear, if the PAT value is <code>XYZ</code>, we need to take the base-64 value of <code>:XYZ</code>.

We can then use the following HTTP host header:

```text
Authorization: Basic BASE64PATSTRING
```

A C# example is given at the <a href="https://docs.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/pats?view=vsts">bottom of this article</a>.

<h2>Creating a release</h2>

Now we can look at specific API.

First we'll need to <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/release/releases/create?view=azure-devops-rest-5.0">create a release</a>:

```text
POST https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/releases?api-version=5.0-preview.8
```

The <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/release/releases/create?view=azure-devops-rest-5.0#request-body">request body can contain a few specifics</a>, such as an artefact list.

The real key value to pass in the body is the <code>release definition ID</code>.  This can be found by looking at the URL when looking at a release definition.  It is present in the URL query string under <code>definitionId</code>.

It typically is a small integer (e.g. 1, 2, 3, etc.).

This API returns a payload of information.  The key value to keep is the <code>id</code>.  This is the <code>release-id</code>.  We'll need it to inquire about the release status.

<h2>Getting a release status</h2>

In order to wait for the release to be over, we'll need to probe the <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/release/releases/get%20release?view=azure-devops-rest-5.0">get-release API</a>:

```text
GET https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/releases/{releaseId}?api-version=5.0-preview.8
```

This is where the <code>releaseId</code> we got from the previous API comes handy.

It is pretty <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/release/releases/get%20release?view=azure-devops-rest-5.0#examples">straightforward to use</a>.

The returned payload contains information about the release and each of its stage.  The stages information can be found under the <code>environments</code> JSON property.  Each of those stage have a <a href="https://docs.microsoft.com/en-ca/rest/api/azure/devops/release/releases/get%20release?view=azure-devops-rest-5.0#environmentstatus">status</a>.  This is the value we need to monitor.

<h2>Summary</h2>

We hope this quick look at Azure DevOps API gives enough pointer to start using them.

In the next article, we'll look at an example implemented using Azure Logic Apps.