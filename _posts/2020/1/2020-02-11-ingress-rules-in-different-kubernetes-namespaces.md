---
title: Ingress rules in different Kubernetes namespaces
permalink: /2020/02/11/ingress-rules-in-different-kubernetes-namespaces
categories:
- Solution
tags:
    - Containers
    - Web
    - Networking
date:  2020/02/1
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/1/ingress-rules-in-different-kubernetes-namespaces/black-and-white-carbon-close-up-close-up-2092075.jpg" />

In this article I want to show how an ingress controller in Kubernetes can be use to route traffic to workloads deployed in multiple namespaces.

The [online doc](https://docs.microsoft.com/en-us/azure/aks/ingress-basic) for AKS deploys everything in the same namespace.  Hence this article is a thin extension to the online doc.

The basic trick is to deploy the ingress rules in the same namespace the service they point to is.

This **isn't Azure / AKS specific**, although this is what I use to demonstrate it, it is generic Kubernetes.

As usual, the [code is in GitHub](https://github.com/vplauzon/aks/tree/master/ingress-multiple-ns).

## Installing NGinx

<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/ingress-rules-in-different-kubernetes-namespaces/nginx.png" />

Assuming we are starting from a vanilla cluster, we first need to install an Ingress Controller.

Here we are going to use NGinx, but any Ingress Controller could support the rest of the code.

Details of this installation can be found in the [AKS online documentation](https://docs.microsoft.com/en-us/azure/aks/ingress-basic#create-an-ingress-controller).  The basic steps are:

```bash
# Create a namespace for your ingress resources
kubectl create namespace ingress-basic

# Add the official stable repository
helm repo add stable https://kubernetes-charts.storage.googleapis.com/

# Use Helm to deploy an NGINX ingress controller
helm install nginx-ingress stable/nginx-ingress \
    --namespace ingress-basic \
    --set controller.replicaCount=2 \
    --set controller.nodeSelector."beta\.kubernetes\.io/os"=linux \
    --set defaultBackend.nodeSelector."beta\.kubernetes\.io/os"=linux
```

This installs the Ingress Controller in the namespace *ingress-basic*.

We can validate the Ingress Controller is installed:

```bash
kubectl get svc -ningress-basic
```

```bash
NAME                            TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)                      AGE
nginx-ingress-controller        LoadBalancer   10.0.211.140   52.228.111.215   80:30725/TCP,443:30354/TCP   34m
nginx-ingress-default-backend   ClusterIP      10.0.82.178    <none>           80/TCP                       34m
```

Remember, [an Ingress Controller is itself a Kubernetes service](https://vincentlauzon.com/2018/11/28/understanding-multiple-ingress-in-aks/).

## Installing services in different namespaces

We're going to use one of the Azure samples charts to deploy services.  Let's add the charts to Helm Repo:

```bash
helm repo add azure-samples https://azure-samples.github.io/helm-charts/
```

Let's create two namespaces:

```bash
kubectl create ns hello1
kubectl create ns hello2
```

Now let's deploy the same chart twice in those two namespaces.  We'll pass different parameters in order to distinguish the deployment (the title is shown in the HTML):

```bash
helm install aks-helloworld azure-samples/aks-helloworld \
    --namespace hello1 \
    --set title="AKS Ingress Demo - 1" \
    --set serviceName="aks-helloworld-one"
helm install aks-helloworld azure-samples/aks-helloworld \
    --namespace hello2 \
    --set title="AKS Ingress Demo - 2" \
    --set serviceName="aks-helloworld-two"
```

We can validate services have been deployed in respective namespaces:

```bash
kubectl get svc -nhello1
kubectl get svc -nhello2
```

We can notice those services do not have external IPs.

## Ingress Rules

We are going to expose the services through ingress rules:

```bash
kubectl apply -f ingress1.yaml
kubectl apply -f ingress2.yaml
```

The yaml files are on GitHub: [ingress1.yaml](https://github.com/vplauzon/aks/blob/master/ingress-multiple-ns/ingress1.yaml) & [ingress2.yaml](https://github.com/vplauzon/aks/blob/master/ingress-multiple-ns/ingress2.yaml)

A couple of things to notice about those ingress rules:

* They are deployed in the same namespace as the service they point to
* They use URL-based routing

The first observation makes the ingress rule work.  The second is simply incidental.  We could have used different routing mechanism, this simply was the simplest to implement.

To put the rule in a namespace, we simply specified the namespace in the metadata section.  For example, in [ingress1.yaml](https://github.com/vplauzon/aks/blob/master/ingress-multiple-ns/ingress1.yaml#L5):

```bash
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress-hello-world-1
  namespace: hello1
```


## Testing the solution

We can test those rules.  First, let's find the Public IP of the Ingress Controller.  We have already seen it when we validated the deployment of the ingress controller:

```bash
kubectl get svc -ningress-basic
```

```bash
NAME                            TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)                      AGE
nginx-ingress-controller        LoadBalancer   10.0.211.140   52.228.111.215   80:30725/TCP,443:30354/TCP   34m
nginx-ingress-default-backend   ClusterIP      10.0.82.178    <none>           80/TCP                       34m
```

In our case, the public IP is **52.228.111.215**.  We can find that public IP in the managed resource group (i.e. *MC_...* resource group).

If we browse to that IP we should have a `default backend - 404` message at the root.

If we go at http://52.228.111.215/hello-world-1, we should see `AKS Ingress Demo - 1`.

If we go to http://52.228.111.215/hello-world-2, we should see `AKS Ingress Demo - 2`.

There we have it.  2 services, in separate namespaces, exposed through one Ingress Controller.

## Broken images

We can notice the image link are broken.

This is because both sites point to `/static/...` for their images.

This makes that site a very bad candidate to use URL routing as we did.  But it's simpler to demo...

## Summary

Simple demo for a simple concept.

As mentionned in the introduction, the trick simply to deploy the ingress rules