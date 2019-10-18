---
title:  Service Principal for Logic App Connector
date:  2018-09-25 10:30:57 +00:00
permalink:  "/2018/09/25/service-principal-for-logic-app-connector/"
categories:
- Solution
tags:
- Automation
- Identity
- Integration
- Security
- Serverless
---
<img style="float:right;padding-right:20px;" title="From Pexels" src="https://vincentlauzon.files.wordpress.com/2018/09/architectural-design-architecture-buildings-698174-e1537823468344.jpg" />

<a href="https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-overview">Azure Logic Apps</a> is a powerful integration platform.

It integrates with different services (<a href="https://docs.microsoft.com/en-us/azure/connectors/apis-list">inside and outside Azure</a>) using connectors.

Connectors are responsible to authenticate to the service they represent.

Some connectors will hold the credentials.  This is the case, for instance, of the SQL connector.

Other connectors will by default take the AAD identity of a user.  This is the case, for instance, of Data Factory.  In the case of Data Factory, it uses the AAD to access the Azure REST API.

When we create those connectors in the Portal, they take our identity.  This is done in one flow where we authorize it.  This approach is problematic on multiple levels.

It requires the access token generated from the authorization to be refreshed.  A tenant will have a time out when refresh is no longer authorized.  The user then has to re-authorize in the Portal.  This isn't a great production operation.  In general, the traceability will be done on the end user.  This is sub-optimal too.

A more robust approach is to use an AAD Service Principal.  In that case, the credentials of the principal are stored with the connector.

We will explore that approach in this article.  We will use the Data Factory but this could be used with any connector requiring an AAD account.

As usual, the code is available in <a href="https://github.com/vplauzon/logic-apps/tree/master/data-factory-api">GitHub</a> and we can deploy the solution here:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Flogic-apps%2Fmaster%2Fdata-factory-api%2Fdeploy-df-api.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

<h2>Deployment</h2>

The deployment requires the following 5 parameters:

<table>
<thead>
<tr>
  <th>Name</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Data Factory Name</td>
  <td>Name of the Data Factory.  This needs to be globally unique.</td>
</tr>
<tr>
  <td>Service Principal App Id</td>
  <td>Application ID of the Service Principal.</td>
</tr>
<tr>
  <td>Service Principal Object Id</td>
  <td>Object ID of the Service Principal.</td>
</tr>
<tr>
  <td>Service Principal Secret</td>
  <td>Secret used to authenticate the Service Principal.</td>
</tr>
<tr>
  <td>Service Principal Tenant</td>
  <td>Tenant (i.e. AAD tenant) where the Service Principal lives.</td>
</tr>
</tbody>
</table>

We covered the creation of a service principal in a <a href="https://vincentlauzon.com/2018/08/23/creating-a-service-principal-with-azure-cli/">past article</a>.

The region we select needs to support Data Factory which isn't supported everywhere.  East US is a supported region.

This should deploy the following resources:

<img src="https://vincentlauzon.files.wordpress.com/2018/09/deployment.png" alt="Deployment" />

<h2>Connection with current user</h2>

Let's first look at <em>df-connection-current-user</em>.  This connector is configured, as its name suggests, to use the current user.

<img src="https://vincentlauzon.files.wordpress.com/2018/09/currentuser.png" alt="Current user" />

We see a warning telling us the connection isn't authenticated.

We've seen how to create Logic Apps Connector in a <a href="https://vincentlauzon.com/2017/10/28/how-to-create-a-logic-app-connector-in-an-arm-template/">past article</a>.  The ARM Template used here was:

[code lang=JavaScript]
{
    &quot;type&quot;: &quot;microsoft.web/connections&quot;,
    &quot;apiVersion&quot;: &quot;2016-06-01&quot;,
    &quot;name&quot;: &quot;[variables(&#039;Current User Data Factory Connection Name&#039;)]&quot;,
    &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
    &quot;dependsOn&quot;: [],
    &quot;properties&quot;: {
        &quot;api&quot;: {
            &quot;id&quot;: &quot;[concat(subscription().id, &#039;/providers/Microsoft.Web/locations/&#039;, resourceGroup().location, &#039;/managedApis/azuredatafactory&#039;)]&quot;
        },
        &quot;displayName&quot;: &quot;Current User Data Factory Connection&quot;
    }
}
[/code]

If we click on the warning, we are taken to the following form:

<img src="https://vincentlauzon.files.wordpress.com/2018/09/authorization.png" alt="Authorization" />

If we click the authorize button, we are going to authenticate as ourselves.

<h2>Connection with Service Principal</h2>

Now, let's got to <em>df-connection-principal</em>.  This connector is configured to use the service principal credentials passed to the ARM template.

It doesn't display any warning.

The ARM Template used here was:

[code lang=JavaScript]
{
    &quot;type&quot;: &quot;microsoft.web/connections&quot;,
    &quot;apiVersion&quot;: &quot;2016-06-01&quot;,
    &quot;name&quot;: &quot;[variables(&#039;Principal Data Factory Connection Name&#039;)]&quot;,
    &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
    &quot;dependsOn&quot;: [],
    &quot;properties&quot;: {
        &quot;api&quot;: {
            &quot;id&quot;: &quot;[concat(subscription().id, &#039;/providers/Microsoft.Web/locations/&#039;, resourceGroup().location, &#039;/managedApis/azuredatafactory&#039;)]&quot;
        },
        &quot;displayName&quot;: &quot;Service Princiapl Data Factory Connection&quot;,
        &quot;parameterValues&quot;: {
            &quot;token:clientId&quot;: &quot;[parameters(&#039;Service Principal App Id&#039;)]&quot;,
            &quot;token:clientSecret&quot;: &quot;[parameters(&#039;Service Principal Secret&#039;)]&quot;,
            &quot;token:TenantId&quot;: &quot;[parameters(&#039;Service Principal Tenant&#039;)]&quot;,
            &quot;token:resourceUri&quot;: &quot;https://management.core.windows.net/&quot;,
            &quot;token:grantType&quot;: &quot;client_credentials&quot;
        }
    }
}
[/code]

Credentials are passed in the configuration.  There is no need to authorize / authenticate.

<h2>Logic App integration</h2>

Now let's go to the logic app.  Let's open its designer experience.

The logic app is trivial.  It is a 2 steps app:  one http trigger and one action.

The action is the creation of a pipeline run.  For some reason that doesn't render the information.  If we look at the code view, we can find the <em>path</em> under <em>Create_a_pipeline_run</em>.  The path points to the <em>master</em> pipeline.

Let's <em>Run</em> the Logic App.

It should complete successfully quickly.

<h2>Data Factory logs</h2>

Now if we finally go to the Data Factory.

If we look at the activity logs, we should see something like the following:

<img src="https://vincentlauzon.files.wordpress.com/2018/09/logs.png" alt="Logs" />

In our case we see the last operation, a <em>Create Pipeline Run</em> was done by <em>Vpl-Principal</em>, which is the name of our Service Principal.

So the traceability goes to the configured service principal.

<h2>Role Assignment</h2>

In order for this sample to work, we needed to give the Service Principal the <em>Data Factory Contributor</em> role on the Data Factory.

We've seen how to do role assignment in ARM Template in a <a href="https://vincentlauzon.com/2018/08/15/rbac-and-role-assignment-using-arm-templates/">past article</a>.

[code lang=JavaScript]
{
    &quot;type&quot;: &quot;Microsoft.DataFactory/factories/providers/roleAssignments&quot;,
    &quot;apiVersion&quot;: &quot;2017-05-01&quot;,
    &quot;name&quot;: &quot;[variables(&#039;Data Factory Assignment Name&#039;)]&quot;,
    &quot;dependsOn&quot;: [
        &quot;[resourceId(&#039;Microsoft.DataFactory/factories&#039;, parameters(&#039;Data Factory Name&#039;))]&quot;
    ],
    &quot;properties&quot;: {
        &quot;roleDefinitionId&quot;: &quot;[variables(&#039;Full Data Factory Contributor Role Definition ID&#039;)]&quot;,
        &quot;principalId&quot;: &quot;[parameters(&#039;Service Principal Object Id&#039;)]&quot;
    }
}
[/code]

We could have assigned the role at the resource group level but we prefer to limit the scope.

<h2>Summary</h2>

As we get closer to production-ready with Logic Apps, there are some designer convenience we want to drop.

One of those is to authenticate connectors as ourselves.

We've seen how to do this using a service principal.