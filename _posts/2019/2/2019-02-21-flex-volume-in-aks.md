---
title:  Flex Volume in AKS
date:  2019-02-21 11:30:26 +00:00
permalink:  "/2019/02/21/flex-volume-in-aks/"
categories:
- Solution
tags:
- Containers
- Security
---
<img style="float:left;padding-right:20px;" title="From pixabay.com" src="https://vincentlauzon.files.wordpress.com/2019/02/key-2114046_640-1-e1550086294745.jpg" />

I wanted to start looking at a few modules helping integrate AKS with the rest of Azure.

In a past article, we looked at <a href="https://vincentlauzon.com/2019/02/19/azure-ad-pod-identity-in-aks/">Pod Identity</a>.

This time around, we will look at <a href="https://github.com/Azure/kubernetes-keyvault-flexvol">Flex Volume</a>.

Flex Volume is an integration between AKS and Key Vault.  It allows keys, secrets &amp; certificates (the three main objects of Key Vault) to be exposed as files in a mounted volume in a pod.

As usual, <a href="https://github.com/vplauzon/aks/tree/master/flex-volume">code used here is in GitHub</a>.

<h2>Some details and constraints</h2>

We need an Azure Identity to access Azure Key Vault.  Flex Volume allows for Service Principal and AAD Pod Identity.  In this article we'll use that latter.

Technically, a version of each object (key, secret &amp; certificate) is copied to the mounted volume at pod creation.  For this reason, if an object value changes, i.e. a new version is created, those changes aren't reflected in the mounted volume.  Pods need to be restarted for that.

The mounted volume is of type <a href="https://kubernetes.io/docs/concepts/storage/volumes/#secret">Secret</a>.  Kubernetes secret volumes are based on <a href="https://en.wikipedia.org/wiki/Tmpfs">tmpfs</a>.  This a RAM based and hence can't be access by other pods.  The volume is deleted when the pod is deleted.

<h2>Demo</h2>

Here, we'll simply go through the <a href="https://github.com/Azure/kubernetes-keyvault-flexvol">online documentation</a> but choosing only one path:

<ul>
<li>AKS</li>
<li>Azure AD Pod Identity</li>
</ul>

<h3>Install</h3>

Let's install Flex Volume.  This is done by applying a configuration file.  We can see the file contains a namespace, <em>kv</em>, and a simple daemon set:

```bash
$ kubectl create -f https://raw.githubusercontent.com/Azure/kubernetes-keyvault-flexvol/master/deployment/kv-flexvol-installer.yaml
$ kubectl get ds -n kv

NAMESPACE     NAME                  DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR                 AGE
kv            keyvault-flexvolume   4         4         4       4            4           beta.kubernetes.io/os=linux   71s
```

If we dig in the daemon set configuration, we see it simply installs a driver on each node at <code>/etc/kubernetes/volumeplugins</code>.

<h3>Managed Identity access</h3>

For the Azure AD Pod Identity configuration, we refer to a <a href="https://vincentlauzon.com/2019/02/19/azure-ad-pod-identity-in-aks/">previous article</a>.

Basically, we have an Azure Managed Identity integrated in AKS.  We need to give that identity two separate access:

<ol>
<li>Reader access on the Key Vault resource</li>
<li><strong>Get</strong> permission on each object (key and/or secret and/or certificate)</li>
</ol>

The first access is Azure Control plane.  The second is part of the access policies of Azure Key Vault itself.

<h3>Deploying the pod identity</h3>

We then need to deploy an <em>AzureIdentity</em> and <em>AzureIdentityBinding</em> as usual with AAD Pod Identity.

<h3>Deploying a pod</h3>

We then deploy a pod with the usual <code>kubectl apply -f pod.yaml</code>.

Here is the <a href="https://github.com/vplauzon/aks/blob/master/flex-volume/pod.yaml">pod.yaml file</a>:

```bash
apiVersion: v1
kind: Pod
metadata:
  name: access-kv
  labels:
    aadpodidbinding:  little-pod-binding
spec:
  containers:
  - name: main-container
    image: vplauzon/get-started:part2-no-redis
    volumeMounts:
    - name: secrets
      mountPath: /kvmnt
      readOnly: true
  volumes:
  - name: secrets
    flexVolume:
      driver: "azure/kv"
      options:
        usepodidentity: "true"
        keyvaultname: # Azure Resource name for the Azure Key Vault
        keyvaultobjectnames: myname;myage
        keyvaultobjecttypes: secret;secret # OPTIONS: secret, key, cert
        #keyvaultobjectversions: #  If not provided, take latest
        resourcegroup: # Resource Group where the Key Vault is
        subscriptionid: # ID of the subscription where the Key Vault is
        tenantid: # AAD Tenant ID of the subscription
```subscription
[/code]

First, we notice the <em>aadpodidbinding</em> label that must match the one defined in the <em>AzureIdentityBinding</em> we defined in previous step.

Second, we see the volume is mounted at <code>/kvmnt</code> within the pod.

Third, we see the volume definition includes the 'coordinates' of the Key Vault.

Finally, we see that we fetch two secrets:  <em>myname</em> and <em>myage</em>.

<h3>Test</h3>

We can then test the secrets materialized inside the pod.  For instance, for <em>myname</em> secret:

```bash
$ kubectl exec -it access-kv cat /kvmnt/myname
```

<h2>Summary</h2>

Flex Volume integrates Azure Key Vault inside AKS.

It is quite easy to setup and use.

A difficulty we encountered was forgetting some permission for the managed identity.  Make sure you assigned both Azure RBAC and Key Vault access policies.