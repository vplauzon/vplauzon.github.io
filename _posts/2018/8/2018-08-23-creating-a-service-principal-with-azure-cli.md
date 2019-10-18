---
title:  Creating a Service Principal with Azure CLI
date:  2018-08-23 10:30:26 +00:00
permalink:  "/2018/08/23/creating-a-service-principal-with-azure-cli/"
categories:
- Solution
tags:
- Automation
- Identity
- Security
---
<img style="float:left;" src="https://vincentlauzon.files.wordpress.com/2018/08/adult-blank-business-326576-e1534517575221.jpg" title="From Pexels" />

Service Principals are a bit of a weird beast.  They are <a href="https://vincentlauzon.com/2016/03/10/azure-active-directory-application/">Azure Active Directory applications</a>with kind of an extra bit.  That bit  says they can actually login by themselves.  Hence the name <em>principal</em>.  But being an <em>application</em> is kind of weird.

We covered <em>Service Principals</em> <a href="https://vincentlauzon.com/2016/02/04/using-azure-active-directory-service-principal/">in the past</a>.  We covered how to create them using PowerShell.

Here I wanted to cover how to create them using the <a href="https://docs.microsoft.com/en-us/cli/azure/install-azure-cli">Azure Command Line Interface</a> (CLI).

Short and sweet, let's just do that.

<h2>Components of a Service Principal</h2>

A good way to understand the different parts of a Service Principal is to type:

[code lang=bash]
az ad sp show --id &lt;Object ID&gt;
[/code]

This will return a JSON payload of a given principal.

The following command will return the different credentials of the principal:

[code lang=bash]
az ad sp credential list --id &lt;Object ID&gt;
[/code]

With that we can sketch the important components for us:

<table>
<thead>
<tr>
  <th>Component</th>
  <th>Type</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Display Name</td>
  <td>string</td>
  <td>Human readable name of the service principal</td>
</tr>
<tr>
  <td>Owner Tenant ID</td>
  <td>Guid</td>
  <td>The tenant owning the service principal.  This is useful if the principal was <em>imported</em> into our tenant.</td>
</tr>
<tr>
  <td>App ID</td>
  <td>Guid</td>
  <td>The ID of the App.</td>
</tr>
<tr>
  <td>Object ID</td>
  <td>Guid</td>
  <td>The ID of the App?</td>
</tr>
<tr>
  <td>Credentials</td>
  <td>Array of credentials</td>
  <td>A principal can have multiple credentials.  They each have a different validity <em>time window</em>.</td>
</tr>
</tbody>
</table>

First observation, let's get it out of the way:  the ids.  Responsible for a lot of confusions, there are two.  Each objects in Azure Active Directory (e.g. User, Group) have an Object ID.

An application also has an <em>Application ID</em>.  Remember, a Service Principal is an application.

Some API will need the <em>Object ID</em>, others the <em>Application ID</em>.

To make matter worse they aren't always refered to with those names.  For instance, if we look at the documentation for <code>az ad sp show -h</code>, we get (at the time of this writing, i.e. mid-August 2018):

<img src="https://vincentlauzon.files.wordpress.com/2018/08/sp.png" alt="Show documentation" />

The tragedy here is that using the service principal display name doesn't work nor does the object id.  We need to use the <em>Application ID</em>.  Hopefully, the documentation will be fixed by the time you read this.

So <em>Object ID</em> and <em>Application ID</em> are a little confusing and aren't going anywhere soon.  We just have to live with that fact.  Now we are aware of it.

Another interesting aspect is that a principal can have multiple credentials.

This is useful to roll out credentials.  For instance, we create a new credential a few days before the old one expires.  We then have some times to roll out the new credentials while the old one is still active.

It is important to remember that credentials aren't valid forever.  They will simply stop working if not replaced.

We can also revoke credentials.  This is very useful if a credential gets compromised.

<h2>Creating Service Principal</h2>

Now let's get at it.

The basic command is <code>az ad sp create-for-rbac</code>.  The issues with using it <em>vanilla style</em>, i.e. with no parameters are:

<ul>
<li>The display name is generated (e.g. <em>azure-cli-2018-08-17-15-31-11</em>)</li>
<li>There is one credential of type <em>password</em> valid for a single year</li>
<li>The service principal becomes contributor on the entire subscription</li>
</ul>

The first element is an inconvenience.  We prefer to have meaningful display name as it facilitates operations.

The second can be ok in many cases.  It is simply important to be aware of.

The third one is simply wrong.  In this blog we keep professing the <a href="https://en.wikipedia.org/wiki/Principle_of_least_privilege">Principle of Least Priviledge</a> and we'll do it again.  Giving too many access to an entity is opening attack surface.

So, instead we recommand using the following form:

[code lang=bash]
az ad sp create-for-rbac -n &lt;Service Principal Name&gt; --skip-assignment
[/code]

<code>-n</code> allows us to give our principal a display name.  <code>--skip-assignment</code> <em>skips</em> the role assignment.  That is, the principal isn't given any access to our subscription.

We could have further customized by using a certificate instead of a password.  We can also input a password instead of having one generated.  We can also customize the date when the credential will be valid.  Type <code>az ad sp create-for-rbac -h</code> for details.

<h2>Results</h2>

When our command executes, it returns a JSON payload such as this one:

[code lang=bash]
{
  &quot;appId&quot;: &quot;fe9ef829-ecc5-4573-ba2b-a3c391de49ee&quot;,
  &quot;displayName&quot;: &quot;MyAksDelegate&quot;,
  &quot;name&quot;: &quot;http://MyAksDelegate&quot;,
  &quot;password&quot;: &quot;9dee4d72-8894-4028-977b-c05ca23dbd6d&quot;,
  &quot;tenant&quot;: &quot;72f988bf-86f1-41af-91ab-2d7cd011db47&quot;
}
[/code]

The <code>appId</code> property is the <em>Application ID</em> we talked about.  It is important to remember.

The <code>password</code> is also important as it will be needed for the principal to authenticate.

Remains the elusive <em>Service Principal Object ID</em>.  It will eventually be needed, so let's find it now.

[code lang=bash]
az ad sp show --id &lt;Application ID&gt;
[/code]

Results

[code lang=bash]
AppId                                 DisplayName    ObjectId                              ObjectType
------------------------------------  -------------  ------------------------------------  ----------------
fe9ef829-ecc5-4573-ba2b-a3c391de49ee  MyAksDelegate  e2b56ea3-98fa-4f01-8f0a-fbc080909bea  ServicePrincipal
[/code]

We found our <em>Object ID</em> right there.

<h2>Summary</h2>

Hopefully those instructions here are useful to create a service principal.

We also explored a little bit what is going on under the hood.