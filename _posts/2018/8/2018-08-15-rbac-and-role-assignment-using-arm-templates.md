---
title:  RBAC and role assignment using ARM Templates
date:  2018-08-15 06:30:16 -04:00
permalink:  "/2018/08/15/rbac-and-role-assignment-using-arm-templates/"
categories:
- Solution
tags:
- Automation
- Identity
- Security
---
<a href="http://vincentlauzon.files.wordpress.com/2018/08/adult-army-competition-73869.jpg"><img style="float:right;" title="adult-army-competition-73869" src="http://vincentlauzon.files.wordpress.com/2018/08/adult-army-competition-73869_thumb.jpg" alt="Roles" width="320" height="231" /></a>
Azure supports <a href="https://docs.microsoft.com/en-us/azure/role-based-access-control/overview">Role Based Access Control</a> (RBAC) as an access control paradigm.

It allows to map a user (or a group of users) to a role within a given scope (resource, resource group, <a href="https://docs.microsoft.com/en-us/azure/architecture/cloud-adoption-guide/subscription-governance">subscription</a> or <a href="https://docs.microsoft.com/en-us/azure/azure-resource-manager/management-groups-overview">management group</a>).

For instance, we could map my user identity to a Virtual Machine Contributor in the scope of a resource group.

A role is itself an aggregation of actions.

It is quite easy to do <a href="https://docs.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal">role assignment using the Azure Portal</a>.  I find the <a href="https://docs.microsoft.com/en-us/azure/role-based-access-control/role-assignments-template">online documentation about role assignment using ARM templates</a> lacking.  It only covers assignment to resource groups and doesn’t show how to find roles.

So let’s do that here.

Artefacts are in <a href="https://github.com/vplauzon/arm/tree/master/rbac">GitHub</a>.  It can easily be deployed with this button:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Farm%2Fmaster%2Frbac%2Frbac.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy to Azure" /></a>

This deploys an empty <em>Logic App</em> and assigns an identity a role to the resource group and the logic app itself.  The reason we deploy a <em>Logic App</em> is because it is very fast to deploy and being <em>serverless</em>, it doesn't incure any cost.

We will lack two parameters:  a role and an identity.

<h2>Finding a role</h2>

First, we need to find a role to assign.

Here we will use the Azure Command Line Interface (CLI).  The same thing could be done in PowerShell using the <code>Get-AzureRmRoleDefinition</code> command.

We can type

```bash
az role definition list -o table
```

This gives a list of all the roles available.  It's a little hard to read since the output is large.  We can narrow it by using <a href="http://jmespath.org/">JMESPath standard</a>:

```bash
az role definition list --query "[*].{roleName:roleName, name:name}" -o table
```

This should give us an output similar to:

```text
RoleName                                              Name
----------------------------------------------------  ------------------------------------
Azure Service Deploy Release Management Contributor   21d96096-b162-414a-8302-d8354f9d91b2
CAL-Custom-Role-67b91599-1e50-49eb-8780-881e4f7ca44e  7b266cd7-0bba-4ae2-8423-90ede5e1e898
Dsms Role (deprecated)                                b91f4c0b-46e3-47bb-a242-eecfe23b3b5b
Dsms Role (do not use)                                7aff565e-6c55-448d-83db-ccf482c6da2f
GenevaWarmPathResourceContributor                     9f15f5f5-77bd-413a-aa88-4b9c68b1e7bc
...
```

In our case, we would be interested i

```bash
az role definition list --query "[? starts_with(roleName, 'Logic')].{roleName:roleName, name:name}" -o table
```

which returns us:

```text
RoleName               Name
---------------------  ------------------------------------
Logic App Contributor  87a39d53-fc1b-424a-814c-f7e04687dc9e
Logic App Operator     515c2055-d9d4-4321-b1b9-bd0c9a0f79fe
```

Let's keep the <em>name</em> of the role, i.e. the <em>GUID</em>.  We choose the <em>Logic App Contributor</em>.

<h2>Finding an identity</h2>

Next we need an identity to assign that role.

There are three types of identity that makes sense here:  user, group and service principal.

<h3>Finding a user</h3>

We can list the users in Azure AD with

```bash
az ad user list -o table
```

For large directories, this would return a lot of data.  We can filter by <em>display name</em> prefix.  The display name is something like <em>John Smith</em> as opposed to <em>jsmith</em>.

```bash
az ad user list --display-name john -o table
```

We need to find the user we're interested in and the corresponding <em>ObjectId</em>, which is a <em>GUID</em>.

<h3>Finding a group</h3>

Similarly, we can find a group starting with <em>admins</em> with

```bash
az ad group list --display-name admins -o table
```

<h3>Finding a Service Principal</h3>

Similarly for Service principals starting with <em>my</em>

```bash
az ad sp list --display-name my -o table
```

It is important to take the <em>ObjectId</em> and not the <em>AppId</em>.  Those two have different values.

<h2>Assignment to a resource group</h2>

We now have the two parameters we needed to feed the ARM template we proposed at the beginning of this article.

If we run the template, we should have a resource group looking like this:

<a href="/assets/2018/8/rbac-and-role-assignment-using-arm-templates/rg.png"><img src="/assets/2018/8/rbac-and-role-assignment-using-arm-templates/rg.png" alt="Deployed Resource Group" /></a>

We can select the <em>EmptyLogicApp</em> resource.  We can then select the <em>Access control (IAM)</em> menu on the left-hand side menu:

<a href="/assets/2018/8/rbac-and-role-assignment-using-arm-templates/iam.png"><img src="/assets/2018/8/rbac-and-role-assignment-using-arm-templates/iam.png" alt="Role assignments" /></a>

Let's focus on <em>Logic App Contributor</em> section.  This is the role we choose.

We have two assignments of the same role under two scopes:

<ul>
<li>The first one is the resource itself</li>
<li>The second one is inherited from the resource group</li>
</ul>

There is a quickstart template doing a <a href="https://azure.microsoft.com/en-ca/resources/templates/101-rbac-builtinrole-resourcegroup/">resource group role assignment</a>.

Basically, a role assignment is modelled as an Azure resource.  This is akeen to relational databases where many-to-many relationships are modelled as an entry in a relation table.

Here is the resource in <a href="https://github.com/vplauzon/arm/blob/master/rbac/rbac.json">our template</a>:

```JavaScript
{
    "type": "Microsoft.Authorization/roleAssignments",
    "apiVersion": "2017-09-01",
    "name": "[guid(concat(resourceGroup().id), resourceId('Microsoft.Logic/workflows', 'EmptyLogicApp'), variables('Full Role Definition ID'))]",
    "dependsOn": [
        "[resourceId('Microsoft.Logic/workflows', 'EmptyLogicApp')]"
    ],
    "properties": {
        "roleDefinitionId": "[variables('Full Role Definition ID')]",
        "principalId": "[parameters('AAD Object ID')]",
        "scope": "[resourceGroup().id]"
    }
}
```

A few observations:

<ul>
<li>The type is <em>Microsoft.Authorization/roleAssignments</em> ; this is a constant type for resource groups</li>
<li>The name of the resource needs to be a <em>unique</em> GUID ; we use the <a href="https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-template-functions-string#guid"><em>guid</em> arm template function</a>, but we could have simply passed a generated <em>GUID</em></li>
<li>We use the role definition id we picked up earlier</li>
<li>We use the principal id we picked up earlier</li>
<li>The scope is the resource group and for that we need to pass the resource group id</li>
</ul>

<h2>Assignment to a specific resource</h2>

There is a quickstart template doing a <a href="https://azure.microsoft.com/en-ca/resources/templates/101-rbac-builtinrole-virtualmachine/">resource group role assignment</a>.

Although only the scope is different, the solution isn't so similar.  Let's look at <a href="https://github.com/vplauzon/arm/blob/master/rbac/rbac.json">our template</a> again:

```JavaScript
{
    "type": "Microsoft.Logic/workflows/providers/roleAssignments",
    "apiVersion": "2017-05-01",
    "name": "[variables('Logic App Assignment Name')]",
    "dependsOn": [
        "[resourceId('Microsoft.Logic/workflows', 'EmptyLogicApp')]"
    ],
    "properties": {
        "roleDefinitionId": "[variables('Full Role Definition ID')]",
        "principalId": "[parameters('AAD Object ID')]"
    }
}
```

Again a few observations:

<ul>
<li>The type is <em>Microsoft.Logic/workflows/providers/roleAssignments</em> ; the type is different depending on the related resource, here a <em>Logic App</em></li>
<li>The name of the resource is defined in a variable as <code>[concat(variables('Logic App Name'), '/Microsoft.Authorization/', guid(concat(resourceGroup().id), variables('Full Role Definition ID')))]</code> ; here it isn't just a random GUID, it is a meaningful name as it refers to both the <em>Logic App</em> name and the <em>Role Definition id</em></li>
<li>Both role definition id &amp; principal id are used as for resource group</li>
</ul>

The resource content is different from a resource group assignation.  It is quite predictable though and easy to replicate.

<h2>Summary</h2>

We've seen how to assign a role to both a resource group and a single resource.

This is useful as we can setup RBAC permissions straight from an ARM template.