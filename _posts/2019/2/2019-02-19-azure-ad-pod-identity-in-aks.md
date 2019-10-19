---
title: Azure AD Pod Identity in AKS
date: 2019-02-19 06:30:22 -05:00
permalink: /2019/02/19/azure-ad-pod-identity-in-aks/
categories:
- Solution
tags:
- Containers
- Identity
- Security
---
<img style="float:right;padding-right:20px;" title="From pixabay.com" src="/assets/2019/2/azure-ad-pod-identity-in-aks/woman-565127_640-e1549908051349.jpg" />

I wanted to start looking at a few modules helping integrate AKS with the rest of Azure.

A big integration point is identity.  For many reasons, we'll want our pods to use service principal identities:

<ol>
<li>Access an Azure service supporting AAD-integration

<ul>
<li><a href="https://docs.microsoft.com/en-ca/azure/storage/blobs/data-lake-storage-access-control#azure-role-based-access-control-rbac">Data Lake Store</a></li>
<li><a href="https://docs.microsoft.com/en-us/azure/sql-database/sql-database-aad-authentication">Azure SQL DB</a></li>
<li><a href="https://docs.microsoft.com/en-us/azure/key-vault/key-vault-secure-your-key-vault#authenticate-by-using-azure-active-directory">Azure Key Vault</a></li>
<li>Many more...</li>
</ul></li>
<li>Access Azure Resource Manager (ARM) API</li>
<li>Authenticate to another API using Azure AD identities</li>
</ol>

In this article, we'll look at <a href="https://github.com/Azure/aad-pod-identity">Azure AD Pod Identity</a> as a simple solution to deal with this.

This feature currently (as of mid February 2019) is marked as <a href="https://azure.microsoft.com/en-us/updates/aks-pod-identity/">in development</a>.  It is <a href="https://github.com/Azure/aad-pod-identity">available on GitHub</a> but should be integrated in the AKS service in a few months.

As usual, the <a href="https://github.com/vplauzon/aks/tree/master/aad-pod-identity">code is in GitHub</a>.

<h2>Traditional Approach</h2>

<img style="float:left;padding-right:20px;" title="From pixabay.com" src="/assets/2019/2/azure-ad-pod-identity-in-aks/black-and-white-fabric-factory-355135-1-e1549912524285.jpg" />

To do one of the scenarios enumerated above traditionally, we would need to get a hold to a Service Principal's client-id and secret / certificate.  We can then call Azure AD authentication API and receive an access token.  We can then use that access token with different API calls (see <a href="https://vincentlauzon.com/2016/03/11/securing-rest-api-using-azure-active-directory/">this article for an example</a>).

The massive drawback with that approach is the secret management:  identity credentials are exposed to application and we need to rotate those secrets.

We could avoid those drawbacks by using <a href="https://docs.microsoft.com/en-us/azure/key-vault/key-vault-overview">Azure Key Vault</a> to store our secrets.  We then face the authentication bootstrapping problem.  We need an identity to access Azure Key Vault, where do we store the secret / certificate of that identity?

<h2>Managed Identities</h2>

That last issue is solved by <a href="https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview">Azure Managed Identities</a>.  A system-assigned managed identity let a service, e.g. a Virtual Machine, acquire an identity.  From there, applications do not need to know the credentials of that identity.  They get access tokens from the VM itself.  The credentials are never known, hence never leaked.  They are also managed in the sense that rotation of credentials is taken care of by the platform.

AKS pod identities rely on something similar called <a href="https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview#how-does-the-managed-identities-for-azure-resources-worka-namehow-does-it-worka">User assigned managed identity</a>.  This allows users to create identities, bind them to pods and have pods acquire access tokens directly, without authenticating.

In both cases the acquisition of access tokens is done by using a well known endpoint, the Azure Instance Metadata Service identity endpoint:  http://169.254.169.254/metadata/identity/oauth2/token.  This endpoint is only accessible from apps using the managed identity.

<h2>Concepts</h2>

The <a href="https://github.com/Azure/aad-pod-identity">GitHub repository</a> explains the concepts well.

Basically, the <a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#deploy-the-azure-aad-identity-infra">deployment script</a> deploys 3 custom resource definitions, a daemon set and a replica set (deployment).

The 3 custom resource definitions are:

<ul>
<li>AzureIdentity</li>
<li>AzureIdentityBinding</li>
<li>AzureAssignedIdentity</li>
</ul>

The first two are then used by users to configure pods while the third one is used by a custom controller (the MIC).

The daemon set is the <a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#node-managed-identity-nmi">Node Managed Identity</a> (NMI).  Requests done to the Instance Metadata Service endpoint (http://169.254.169.254/metadata/identity/oauth2/token) are rerouted to the local pod of that daemon set.  It then does a request for token on behalf of the pod.

The deployment / replicaset is the <a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#managed-identity-controller-mic">Managed Identity Controller</a>(MIC).  Like other controllers in Kubernetes (e.g. Replica Set is a controller), it watches the Kubernetes API Server for changes in pod population.

<h2>Configuration</h2>

We won't replicate the <a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#get-started">tutorial from the GitHub repo</a>.  Instead, we'll highlight details and dive deeper on some aspects.

To configure a pod to use a pod identity, we first <a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#create-user-azure-identity">create a user managed identity</a>.  We then create an <a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#install-user-azure-identity-on-k8s-cluster">AzureIdentity resource</a>, for instance:

```text
apiVersion: "aadpodidentity.k8s.io/v1"
kind: AzureIdentity
metadata:
 name: <a-idname>
spec:
 type: 0
 ResourceID: /subscriptions/<subid>/resourcegroups/<resourcegroup>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<managedidentity-resourcename>
 ClientID: <clientid>
```

Basically, we reflect the Azure resource inside Kubernetes.

We then create an <a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#install-pod-to-identity-binding-on-k8s-cluster">AzureIdentityBinding</a> which binds that identity to pods, via label selector:

```text
apiVersion: "aadpodidentity.k8s.io/v1"
kind: AzureIdentityBinding
metadata:
 name: demo1-azure-identity-binding
spec:
 AzureIdentity: <a-idname>
 Selector: <label value to match>
```

That's it.

The resource relationships are as follow:

<img src="/assets/2019/2/azure-ad-pod-identity-in-aks/binding-1.png" alt="Bindings" />

As usual in Kubernetes, we do not point to pods directly, as they are ephemeral.  We point to labels characterising the pods.  In this case, we look for a well-known label with the name <em>aadpodidbinding</em>.

<h2>How does that work exactly?</h2>

If a fair share of magic seemed to be involved, let's look back in slow motion.

When we create an <em>AzureIdentity</em>, nothing happens beside the identity being registered as a resource in etcd (Kubernetes persistent store).

When we create an <em>AzureIdentityBinding</em>, the Managed Identity Controller (MIC) starts to look for pods with the specified labels.  For each of those pods, it configures the pod's routing table to reroute the Instance Metadata Service endpoint to the Node Managed Identity (NMI).  The MIC then monitors for new pods with configured

There is a <a href="https://github.com/Azure/aad-pod-identity/blob/master/docs/design/concept.png">great summary diagram</a> on the GitHub site showing those interactions:

<img src="/assets/2019/2/azure-ad-pod-identity-in-aks/concept.png" alt="Concepts" />

<h2>Security</h2>

Now what is the access chaining that let our app have access to a Token?

The <a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#providing-required-permissions-for-mic">key is that AKS is running under its own service principal</a>.  That service principal is used to access Azure Resources.  For instance, when we create a Kubernetes Service of type <em>load balancer</em>, it is that service principal that creates an Azure Load Balancer.

That service principal also is the one requesting the access token at the end.  For that reason, we must configure the service principal to have the role <em>Managed Identity Operator</em> on the managed user we created.

By default, the AKS service principal is contributor on the managed resource group (i.e. resource group where the Azure VMs for AKS are) but not the resource group where AKS resource is.

We can look at predefined roles by typing <code>az role definition list -o table | less</code>.  We can also look at <em>Managed Identity Operator</em> specifically by typing <code>az role definition list --query "[?roleName == 'Managed Identity Operator']" -o jsonc</code>.  We can see that role has the following actions:

<ul>
<li>Microsoft.ManagedIdentity/userAssignedIdentities/*/read</li>
<li>Microsoft.ManagedIdentity/userAssignedIdentities/*/assign/action</li>
<li>Microsoft.Authorization/*/read</li>
<li>Microsoft.Insights/alertRules/*</li>
<li>Microsoft.Resources/subscriptions/resourceGroups/read</li>
<li>Microsoft.Resources/deployments/*</li>
<li>Microsoft.Support/*</li>
</ul>

For more details on RBAC in Azure, <a href="https://github.com/vplauzon/azure-training/tree/master/rbac">please consult this short training</a>.

It really is a chain of trust here.

<h2>Demo</h2>

Now let's quickly demo what we have learn.

Let's do the steps lined up in the <a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#get-started">tutorial online</a>:

<ul>
<li><a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#deploy-the-azure-aad-identity-infra">We install the infrastructure</a></li>
<li><a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#create-user-azure-identity">We create a managed identity</a> ; we name the identity <em>vpl-id</em> and put it in the same resource group as our AKS cluster</li>
<li><a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#assign-reader-role-to-new-identity">We skip the reader role step</a></li>
<li><a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#providing-required-permissions-for-mic">We assigned the Managed Identity Operator role on AKS service principal on the managed user resource</a></li>
<li><a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#install-user-azure-identity-on-k8s-cluster">We install the user we created in AKS</a></li>
<li><a href="https://github.com/Azure/aad-pod-identity/blob/master/README.md#install-pod-to-identity-binding-on-k8s-cluster">We install the identity binding in AKS</a></li>
<li>Finally, we deploy a single pod:  <code>kubectl apply -f https://raw.githubusercontent.com/vplauzon/aks/master/aad-pod-identity/pod.yaml</code></li>
</ul>

Notice the pod has a label <code>aadpodidbinding:  little-pod-binding</code>.  This label must match the selected in the <em>AzureIdentityBinding</em>.  For instance:

```bash
apiVersion: "aadpodidentity.k8s.io/v1"
kind: AzureIdentityBinding
metadata:
    name: vpl-id-to-little-pod
spec:
    AzureIdentity: vpl-id
    Selector:  little-pod-binding
```

We now have a pod running which should have access to the managed identity access tokens.  Let's test that:

```bash
$ kubectl exec test-id-pod -it sh
/ # curl  http://169.254.169.254/metadata/identity/oauth2/token/?resource=https://vault.azure.net
```

This should return a JSON token.

We can see that an <em>AzureAssignedIdentity</em> was created:

```bash
kubectl get AzureAssignedIdentity

NAME                         AGE
test-id-pod-default-vpl-id   58s
```

<h2>Summary</h2>

We've looked at Azure AD Pod Identity, an AKS extension allowing us to use managed user identity with AKS pods.

We looked under the hood to understand the concepts of the extension.

In terms of use, Pod identities are quite simple:

<ul>
<li>Install Azure AD Pod Identity infrastructure in AKS</li>
<li>Azure resources:

<ul>
<li>Create a user managed identity</li>
<li>Make sure the AKS service principal is "Managed Identity Operator" on it</li>
</ul></li>
<li>AKS resources:

<ul>
<li>Create an <em>AzureIdentity</em> matching the User Managed Identity we just created in Auzre</li>
<li>Create an <em>AzureIdentityBinding</em> binding the user managed identity with a pod's label</li>
</ul></li>
<li>Request tokens from within the pod</li>
</ul>