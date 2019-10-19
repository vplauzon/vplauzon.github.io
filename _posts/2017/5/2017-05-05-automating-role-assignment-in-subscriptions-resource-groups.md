---
title:  Automating Role Assignment in Subscriptions & Resource Groups
date:  2017-05-05 09:49:42 -04:00
permalink:  "/2017/05/05/automating-role-assignment-in-subscriptions-resource-groups/"
categories:
- Solution
tags:
- Security
---
<a href="assets/2017/5/automating-role-assignment-in-subscriptions-resource-groups/keys-unlock13.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="keys-unlock[1]" src="assets/2017/5/automating-role-assignment-in-subscriptions-resource-groups/keys-unlock1_thumb3.jpg" alt="keys-unlock[1]" width="300" height="200" align="left" border="0" /></a>Azure supports a Role Based Access Control (RBAC) system.  This system links identity (users &amp; groups) to roles.

RBAC is enforced at the REST API access level, which is the fundamental access in Azure:  it can’t be bypassed.

In this article, we’ll look at how we can automate the role assignation procedure.

This is useful if you routinely create resource groups for different people, e.g. each time a department request some Azure environment or even if you routinely create new subscriptions.

We’re going to do this in PowerShell.  So let’s prep a PowerShell environment with Azure SDK &amp; execute the Add-AzureRmAccount (login) command.
<h2>Exploring roles</h2>
A role is an aggregation of actions.

Let’s look at the available roles.

[code language="PowerShell"]

Get-AzureRmRoleDefinition | select Name | sort -Property Name

[/code]

This gives us the rather long list of roles:
<ul>
 	<li>API Management Service Contributor</li>
 	<li>API Management Service Operator Role</li>
 	<li>API Management Service Reader Role</li>
 	<li>Application Insights Component Contributor</li>
 	<li>Application Insights Snapshot Debugger</li>
 	<li>Automation Job Operator</li>
 	<li>Automation Operator</li>
 	<li>Automation Runbook Operator</li>
 	<li>Azure Service Deploy Release Management Contributor</li>
 	<li>Backup Contributor</li>
 	<li>Backup Operator</li>
 	<li>Backup Reader</li>
 	<li>Billing Reader</li>
 	<li>BizTalk Contributor</li>
 	<li>CDN Endpoint Contributor</li>
 	<li>CDN Endpoint Reader</li>
 	<li>CDN Profile Contributor</li>
 	<li>CDN Profile Reader</li>
 	<li>Classic Network Contributor</li>
 	<li>Classic Storage Account Contributor</li>
 	<li>Classic Storage Account Key Operator Service Role</li>
 	<li>Classic Virtual Machine Contributor</li>
 	<li>ClearDB MySQL DB Contributor</li>
 	<li>Contributor</li>
 	<li>Data Factory Contributor</li>
 	<li>Data Lake Analytics Developer</li>
 	<li>DevTest Labs User</li>
 	<li>DNS Zone Contributor</li>
 	<li>DocumentDB Account Contributor</li>
 	<li>GenevaWarmPathResourceContributor</li>
 	<li>Intelligent Systems Account Contributor</li>
 	<li>Key Vault Contributor</li>
 	<li>Log Analytics Contributor</li>
 	<li>Log Analytics Reader</li>
 	<li>Logic App Contributor</li>
 	<li>Logic App Operator</li>
 	<li>Monitoring Contributor Service Role</li>
 	<li>Monitoring Reader Service Role</li>
 	<li>Network Contributor</li>
 	<li>New Relic APM Account Contributor</li>
 	<li>Office DevOps</li>
 	<li>Owner</li>
 	<li>Reader</li>
 	<li>Redis Cache Contributor</li>
 	<li>Scheduler Job Collections Contributor</li>
 	<li>Search Service Contributor</li>
 	<li>Security Admin</li>
 	<li>Security Manager</li>
 	<li>Security Reader</li>
 	<li>SQL DB Contributor</li>
 	<li>SQL Security Manager</li>
 	<li>SQL Server Contributor</li>
 	<li>Storage Account Contributor</li>
 	<li>Storage Account Key Operator Service Role</li>
 	<li>Traffic Manager Contributor</li>
 	<li>User Access Administrator</li>
 	<li>Virtual Machine Contributor</li>
 	<li>Web Plan Contributor</li>
 	<li>Website Contributor</li>
</ul>
Some roles are specific, e.g. <em>Virtual Machine Contributor</em>, while others are much broader, e.g. <em>Contributor</em>.

Let’s look at a specific role:

[code language="PowerShell"]

Get-AzureRmRoleDefinition &quot;Virtual Machine Contributor&quot;

[/code]

This gives us a role definition object:

[code language="PowerShell"]

Name             : Virtual Machine Contributor
Id               : 9980e02c-c2be-4d73-94e8-173b1dc7cf3c
IsCustom         : False
Description      : Lets you manage virtual machines, but not access to them, and not the virtual network or storage account
they�re connected to.
Actions          : {Microsoft.Authorization/*/read, Microsoft.Compute/availabilitySets/*, Microsoft.Compute/locations/*,
Microsoft.Compute/virtualMachines/*...}
NotActions       : {}
AssignableScopes : {/}

[/code]

Of particular interest are the actions allowed by that role:

[code language="PowerShell"]

(Get-AzureRmRoleDefinition &quot;Virtual Machine Contributor&quot;).Actions

[/code]

This returns the 34 actions (as of the time of this writing) the role enables:
<ul>
 	<li>Microsoft.Authorization/*/read</li>
 	<li>Microsoft.Compute/availabilitySets/*</li>
 	<li>Microsoft.Compute/locations/*</li>
 	<li>Microsoft.Compute/virtualMachines/*</li>
 	<li>Microsoft.Compute/virtualMachineScaleSets/*</li>
 	<li>Microsoft.Insights/alertRules/*</li>
 	<li>…</li>
</ul>
We see that wildcards are used to allow multiple actions.  Therefore there are actually much more than 34 actions allowed by this role.

Let’s look at a more generic role:

[code language="PowerShell"]

Get-AzureRmRoleDefinition &quot;Contributor&quot;

[/code]

This role definition object is:

[code language="PowerShell"]

Name             : Contributor
Id               : b24988ac-6180-42a0-ab88-20f7382dd24c
IsCustom         : False
Description      : Lets you manage everything except access to resources.
Actions          : {*}
NotActions       : {Microsoft.Authorization/*/Delete, Microsoft.Authorization/*/Write,
Microsoft.Authorization/elevateAccess/Action}
AssignableScopes : {/}

[/code]

We notice that all actions (*) are allowed but that some actions are explicitly disallowed via the <em>NotActions</em> property.

[code language="PowerShell"]

(Get-AzureRmRoleDefinition &quot;Contributor&quot;).NotActions

[/code]

<ul>
 	<li>Microsoft.Authorization/*/Delete</li>
 	<li>Microsoft.Authorization/*/Write</li>
 	<li>Microsoft.Authorization/elevateAccess/Action</li>
</ul>
We could create custom roles aggregating arbitrary groups of actions together but we won’t cover that here.
<h2>Users &amp; Groups</h2>
<a href="assets/2017/5/automating-role-assignment-in-subscriptions-resource-groups/groups-meeting-dark-icon1.png"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="Groups-Meeting-Dark-icon[1]" src="assets/2017/5/automating-role-assignment-in-subscriptions-resource-groups/groups-meeting-dark-icon1_thumb.png" alt="Groups-Meeting-Dark-icon[1]" width="128" height="128" align="right" border="0" /></a>

Now that we know about role, let’s look at users &amp; groups.

Users &amp; groups will come from the Azure AD managing our Azure subscription.

We can grab a user with <em>Get-AzureRmADUser</em>.  This will list all the users in the tenant.  If you are part of a large organization, this is likely a long list.  We can grab a specific user with the following command:

[code language="PowerShell"]

Get-AzureRmADUser -UserPrincipalName john.smith@contoso.com

[/code]

We need to specify the domain of the user since we could have users coming from different domains inside the same tenant.

Let’s grab the object ID of the user:

[code language="PowerShell"]

$userID = (Get-AzureRmADUser -UserPrincipalName john.smith@contoso.com).Id

[/code]

Similarly, we could grab the object ID of a group:

[code language="PowerShell"]

$groupID = (Get-AzureRmADGroup -SearchString &quot;Azure Team&quot;).Id

[/code]

<h2>Scope</h2>
<a href="assets/2017/5/automating-role-assignment-in-subscriptions-resource-groups/apps-brackets-b-icon1.png"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="Apps-Brackets-B-icon[1]" src="assets/2017/5/automating-role-assignment-in-subscriptions-resource-groups/apps-brackets-b-icon1_thumb.png" alt="Apps-Brackets-B-icon[1]" width="128" height="128" align="left" border="0" /></a>Next thing to determine is the scope where we want to apply a role.

The scope can be either a subscription, a resource group or a resource.

To use our subscription as the scope, let’s run:

[code language="PowerShell"]

$scope = &quot;/subscriptions/&quot; + (Get-AzureRmSubscription)[0].SubscriptionId

[/code]

To use a resource group as the scope, let’s run:

[code language="PowerShell"]

$scope = (Get-AzureRmResourceGroup -Name MyGroup).ResourceId

[/code]

Finally, to use a specific resource as the scope, let’s run:

[code language="PowerShell"]

$scope = (Get-AzureRmResource -ResourceGroupName MyGroup -ResourceName MyResource).ResourceId

[/code]

<h2>Assigning a role</h2>
Ok, let’s do this:  let’s put it all together:

[code language="PowerShell"]

New-AzureRmRoleAssignment -ObjectId $userID -Scope $scope -RoleDefinitionName &quot;Contributor&quot;

[/code]

We can double check in the portal the assignation occurred.
<h2>Summary</h2>
We simply automate the role assignation using PowerShell.

As with everything that can be done in PowerShell, it can be done using Azure Command Line Interface CLI.  Commands are quite similar.

Also, like every automation, it can be bundled in an Azure Automation Runbook.  So if we have routine operations consisting in provisioning subscriptions or resource groups to group of users, we could package it in a Runbook to ensure consistency.