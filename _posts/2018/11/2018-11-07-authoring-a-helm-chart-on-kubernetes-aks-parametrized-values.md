---
title: Authoring a Helm Chart on Kubernetes / AKS - Parametrized values
date: 2018-11-07 06:30:50 -05:00
permalink: /2018/11/07/authoring-a-helm-chart-on-kubernetes-aks-parametrized-values/
categories:
- Solution
tags:
- Containers
- DevOps
---
<img style="float:left;padding-right:20px;" title="From http://pixabay.com" src="/assets/2018/11/authoring-a-helm-chart-on-kubernetes-aks-parametrized-values/typewriter-2095754_640-e1540306145341.jpg" />

In the <a href="https://vincentlauzon.com/2018/10/31/authoring-a-helm-chart-on-kubernetes-aks-getting-started/">last article</a>, we authored a very simple chart.

In this article I want to show how to use one of the powerful features of <a href="https://www.helm.sh/">Helm</a>:  values.

Values act as parameters to a chart.

Having parameters is key for dev ops as we want to deploy the same chart to different environment with different parameters.

As usual, the <a href="https://github.com/vplauzon/helm">code is in GitHub</a>.  In order to try the example in the article, simple clone the repo locally.

Let's dive in!

<h2>A Service</h2>

Let's start by deploying a slightly more <a href="https://github.com/vplauzon/helm/tree/master/b-service">complicated chart</a>.  That chart will deploy a service instead of a namespace.

So, from the root of the repo, we can type:

```bash
$ helm upgrade --install myservice b-service
```

Here we use the idempotent form of install with <em>Helm</em>.  This command will install the first time and update subsequent time.  It is equivalent to a <code>kubectl apply</code>.

We install the chart <em>b-service</em> (which is in the <em>b-service</em> sub folder from the repo's root).  We call the release <em>myservice</em>.

We can see that deployed a cluster-IP service in the <em>b</em> namespace:

```bash
$ kubectl get svc --namespace=b
NAME         TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
my-service   ClusterIP   10.0.44.202   <none>        80/TCP    8m
```

It also deployed a deployment with 2 pods:

```bash
$ kubectl get deploy --namespace=b
NAME            DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
my-deployment   2         2         2            2           8m
```

We could test the service using

```bash
kubectl run -i --tty console --image=appropriate/curl -- sh
```

and <em>curling</em> the service.

Instead, let's look at files in the chart:

```powershell
b-service/
  Chart.yaml
  README.md           # Optional but quick to write
  values.yaml         # Mandatory, but empty in our case
  templates/
    deployment.yaml    # A deployment
    namespace.yaml     # The namespace b
    service.yaml       # A service bound to the deployment
    NOTES.txt          # Optional but quick to write
```

This time around we have two (3) yaml files in the <em>templates</em> folder.

<a href="https://github.com/vplauzon/helm/blob/master/b-service/templates/deployment.yaml">deployment.yaml</a>, a vanilla deployment with 2 replicas:

```powershell
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
  labels:
    app: get-started
spec:
  replicas: 2
  selector:
    matchLabels:
      app: get-started
  template:
    metadata:
      labels:
        app: get-started
    spec:
      containers:
      - name: myapp
        image: vplauzon/get-started:part2-no-redis
        ports:
        - containerPort: 80
```

<a href="https://github.com/vplauzon/helm/blob/master/b-service/templates/namespace.yaml">namespace.yaml</a>, a vanilla namespace:

```powershell
apiVersion: v1
kind: Namespace
metadata:
  name: b
```

<a href="https://github.com/vplauzon/helm/blob/master/b-service/templates/service.yaml">service.yaml</a>, a vanilla service of type <em>ClusterIP</em>:

```powershell
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: ClusterIP
  ports:
  - port: 80
  selector:
    app: get-started
```

This is Helm without values, without parameters.

<h3>Namespace</h3>

Helm can override the default namespace with the <code>--namespace</code> option for the install.

It doesn't manage the namespace as one would expect though.  It doesn't delete the namespace when the Helm release is deleted for instance.  Similarly, it wouldn't recreate a namespace if it gets deleted.  This is a <a href="https://github.com/helm/helm/issues/2013">partially documented issue</a>.

For those reasons we instead manage the namespace explicitly by declaring a namespace object.  This way, when we delete the release, the namespace will go away.  This is useful for the demo aspect of this article.

For traditional work the <code>--namespace</code> is likely more useful.  Often more than one chart / release will go in one namespace.  We just need to be aware of the issue mentionned above.

<h2>Enter values parameters</h2>

Now, let's deploy another chart:

```bash
helm upgrade --install myparameteredsvc c-parametrized-service
```

This is <a href="https://github.com/vplauzon/helm/tree/master/c-parametrized-service">c-parametrized-service</a>.

On the surface, it is quite similar to the previous chart.  It deploys a service and a deployment with 2 replicas:

```bash
$ kubectl get svc --namespace=c
NAME            TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
param-service   ClusterIP   10.0.187.51   <none>        80/TCP    3m

$ kubectl get deploy --namespace=c
NAME          DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
get-started   2         2         2            2           3m
```

The major difference is that this chart uses values.  Let's look at <a href="https://github.com/vplauzon/helm/blob/master/c-parametrized-service/values.yaml">values.yaml</a>:

```bash
#  We use parameters here:
service:
  name:  param-service # Name of the Kubernetes' service
  replicaCount: 2 # Number of pods in the replica set
deployment:
  name:  get-started # Name of the deployment
```

This file is a plain old YAML file.  Any values in the nodes of the YAML tree can be used.  For instance <code>service.name</code>.

For instance, let's look at <a href="https://github.com/vplauzon/helm/blob/master/c-parametrized-service/templates/namespace.yaml">namespace.yaml</a>:

```bash
apiVersion: v1
kind: Namespace
metadata:
  name: {% raw %} {{ .Values.namespace }} {% endraw %}
```

We see the value for the namespace name is pulled from the values yaml tree.

The template files are leveraging <a href="https://golang.org/pkg/text/template/">GO templates</a>.

<h2>Overriding values</h2>

We can then override the values.  We can do it piece by piece, using the <em>set</em> option.  For instance, let's bump the number of replica from 2 to 5:

```bash
helm upgrade --install myparameteredsvc c-parametrized-service --set service.replicaCount=5
```

We can then confirm the number of replica was changed:

```bash
$ kubectl get deploy --namespace=c
NAME          DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
get-started   5         5         5            5           1m
```

Using this we can parametrize a release.

<h2>Overriding many values</h2>

Using the previous method of overriding can quickly become cumbersome.

We can instead pass a file to override values.

Let's look at <a href="https://github.com/vplauzon/helm/blob/master/c-parametrized-service/_values-override.yaml">_values-override.yaml</a>:

```bash
deployment:
  name:  my-deployment
service:
  replicaCount: 4
```

Here we override the replica count but also the name of deployment.

The file name starts with an underscore.  This is a trick to get a file ignored in the chart folder.

We can use that file with the <code>values</code> option:

```bash
helm upgrade --install myparameteredsvc c-parametrized-service --values=c-parametrized-service/_values-override.yaml
```

We can then validate:

```bash
$ kubectl get deploy --namespace=c
NAME            DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
my-deployment   4         4         4            4           30s
```

The number of replica and the name of the deployment just changed.

<h2>Clean up</h2>

We can clean up our cluster with the following command:

```bash
helm delete myservice myparameteredsvc --purge
```

The <code>--purge</code> option clears the releases from Helm's audit.

<h2>Summary</h2>

Using values in our Helm chart makes them parameterizable.

This makes them much more reusable but also enables Dev Ops scenarios.

I hope this article gives you tips to enable you to leverage Helm in your Dev Ops scenarios by authoring great charts!