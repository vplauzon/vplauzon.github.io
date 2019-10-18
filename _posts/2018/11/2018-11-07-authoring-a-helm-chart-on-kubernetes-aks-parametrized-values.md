---
title:  Authoring a Helm Chart on Kubernetes / AKS - Parametrized values
date:  11/07/2018 11:30:50
permalink:  "/2018/11/07/authoring-a-helm-chart-on-kubernetes-aks-parametrized-values/"
categories:
- Solution
tags:
- Containers
- DevOps
---
<img style="float:left;padding-right:20px;" title="From http://pixabay.com" src="https://vincentlauzon.files.wordpress.com/2018/10/typewriter-2095754_640-e1540306145341.jpg" />

In the <a href="https://vincentlauzon.com/2018/10/31/authoring-a-helm-chart-on-kubernetes-aks-getting-started/">last article</a>, we authored a very simple chart.

In this article I want to show how to use one of the powerful features of <a href="https://www.helm.sh/">Helm</a>:  values.

Values act as parameters to a chart.

Having parameters is key for dev ops as we want to deploy the same chart to different environment with different parameters.

As usual, the <a href="https://github.com/vplauzon/helm">code is in GitHub</a>.  In order to try the example in the article, simple clone the repo locally.

Let's dive in!

<h2>A Service</h2>

Let's start by deploying a slightly more <a href="https://github.com/vplauzon/helm/tree/master/b-service">complicated chart</a>.  That chart will deploy a service instead of a namespace.

So, from the root of the repo, we can type:

[code lang=bash]
$ helm upgrade --install myservice b-service
[/code]

Here we use the idempotent form of install with <em>Helm</em>.  This command will install the first time and update subsequent time.  It is equivalent to a <code>kubectl apply</code>.

We install the chart <em>b-service</em> (which is in the <em>b-service</em> sub folder from the repo's root).  We call the release <em>myservice</em>.

We can see that deployed a cluster-IP service in the <em>b</em> namespace:

[code lang=bash]
$ kubectl get svc --namespace=b
NAME         TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
my-service   ClusterIP   10.0.44.202   &lt;none&gt;        80/TCP    8m
[/code]

It also deployed a deployment with 2 pods:

[code lang=bash]
$ kubectl get deploy --namespace=b
NAME            DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
my-deployment   2         2         2            2           8m
[/code]

We could test the service using

[code lang=bash]
kubectl run -i --tty console --image=appropriate/curl -- sh
[/code]

and <em>curling</em> the service.

Instead, let's look at files in the chart:

[code lang=powershell]
b-service/
  Chart.yaml
  README.md           # Optional but quick to write
  values.yaml         # Mandatory, but empty in our case
  templates/
    deployment.yaml    # A deployment
    namespace.yaml     # The namespace b
    service.yaml       # A service bound to the deployment
    NOTES.txt          # Optional but quick to write
[/code]

This time around we have two (3) yaml files in the <em>templates</em> folder.

<a href="https://github.com/vplauzon/helm/blob/master/b-service/templates/deployment.yaml">deployment.yaml</a>, a vanilla deployment with 2 replicas:

[code lang=powershell]
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
[/code]

<a href="https://github.com/vplauzon/helm/blob/master/b-service/templates/namespace.yaml">namespace.yaml</a>, a vanilla namespace:

[code lang=powershell]
apiVersion: v1
kind: Namespace
metadata:
  name: b
[/code]

<a href="https://github.com/vplauzon/helm/blob/master/b-service/templates/service.yaml">service.yaml</a>, a vanilla service of type <em>ClusterIP</em>:

[code lang=powershell]
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
[/code]

This is Helm without values, without parameters.

<h3>Namespace</h3>

Helm can override the default namespace with the <code>--namespace</code> option for the install.

It doesn't manage the namespace as one would expect though.  It doesn't delete the namespace when the Helm release is deleted for instance.  Similarly, it wouldn't recreate a namespace if it gets deleted.  This is a <a href="https://github.com/helm/helm/issues/2013">partially documented issue</a>.

For those reasons we instead manage the namespace explicitly by declaring a namespace object.  This way, when we delete the release, the namespace will go away.  This is useful for the demo aspect of this article.

For traditional work the <code>--namespace</code> is likely more useful.  Often more than one chart / release will go in one namespace.  We just need to be aware of the issue mentionned above.

<h2>Enter values parameters</h2>

Now, let's deploy another chart:

[code lang=bash]
helm upgrade --install myparameteredsvc c-parametrized-service
[/code]

This is <a href="https://github.com/vplauzon/helm/tree/master/c-parametrized-service">c-parametrized-service</a>.

On the surface, it is quite similar to the previous chart.  It deploys a service and a deployment with 2 replicas:

[code lang=bash]
$ kubectl get svc --namespace=c
NAME            TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
param-service   ClusterIP   10.0.187.51   &lt;none&gt;        80/TCP    3m

$ kubectl get deploy --namespace=c
NAME          DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
get-started   2         2         2            2           3m
[/code]

The major difference is that this chart uses values.  Let's look at <a href="https://github.com/vplauzon/helm/blob/master/c-parametrized-service/values.yaml">values.yaml</a>:

[code lang=bash]
#  We use parameters here:
service:
  name:  param-service # Name of the Kubernetes&#039; service
  replicaCount: 2 # Number of pods in the replica set
deployment:
  name:  get-started # Name of the deployment
[/code]

This file is a plain old YAML file.  Any values in the nodes of the YAML tree can be used.  For instance <code>service.name</code>.

For instance, let's look at <a href="https://github.com/vplauzon/helm/blob/master/c-parametrized-service/templates/namespace.yaml">namespace.yaml</a>:

[code lang=bash]
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .Values.namespace }}
[/code]

We see the value for the namespace name is pulled from the values yaml tree.

The template files are leveraging <a href="https://golang.org/pkg/text/template/">GO templates</a>.

<h2>Overriding values</h2>

We can then override the values.  We can do it piece by piece, using the <em>set</em> option.  For instance, let's bump the number of replica from 2 to 5:

[code lang=bash]
helm upgrade --install myparameteredsvc c-parametrized-service --set service.replicaCount=5
[/code]

We can then confirm the number of replica was changed:

[code lang=bash]
$ kubectl get deploy --namespace=c
NAME          DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
get-started   5         5         5            5           1m
[/code]

Using this we can parametrize a release.

<h2>Overriding many values</h2>

Using the previous method of overriding can quickly become cumbersome.

We can instead pass a file to override values.

Let's look at <a href="https://github.com/vplauzon/helm/blob/master/c-parametrized-service/_values-override.yaml">_values-override.yaml</a>:

[code lang=bash]
deployment:
  name:  my-deployment
service:
  replicaCount: 4
[/code]

Here we override the replica count but also the name of deployment.

The file name starts with an underscore.  This is a trick to get a file ignored in the chart folder.

We can use that file with the <code>values</code> option:

[code lang=bash]
helm upgrade --install myparameteredsvc c-parametrized-service --values=c-parametrized-service/_values-override.yaml
[/code]

We can then validate:

[code lang=bash]
$ kubectl get deploy --namespace=c
NAME            DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
my-deployment   4         4         4            4           30s
[/code]

The number of replica and the name of the deployment just changed.

<h2>Clean up</h2>

We can clean up our cluster with the following command:

[code lang=bash]
helm delete myservice myparameteredsvc --purge
[/code]

The <code>--purge</code> option clears the releases from Helm's audit.

<h2>Summary</h2>

Using values in our Helm chart makes them parameterizable.

This makes them much more reusable but also enables Dev Ops scenarios.

I hope this article gives you tips to enable you to leverage Helm in your Dev Ops scenarios by authoring great charts!