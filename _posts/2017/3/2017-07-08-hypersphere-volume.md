---
title: Hypersphere Volume
date: 2017-07-08 14:46:50 -07:00
permalink: /2017/07/08/hypersphere-volume/
categories:
- Solution
tags:
- Machine Learning
---
<p><img width="320" height="213" align="right" style="border:0 currentcolor;border-image:none;float:right;display:inline;background-image:none;" alt="abendstimmung, ball-shaped, clouds" src="https://images.pexels.com/photos/220429/pexels-photo-220429.jpeg?w=1260&amp;h=750&amp;auto=compress&amp;cs=tinysrgb" border="0" />In <a href="https://vincentlauzon.com/2017/06/21/hyperspheres-the-curse-of-dimensionality/">our last article</a> we looked at how the dimension of data space impacts Machine Learning algorithms.&nbsp; This is often referred to as the <em>curse of dimensionality</em>.</p><p>At the heart of the article we discussed the fact that an hypersphere hyper-volume trends to zero as dimension increases.</p><p>Here I want to demonstrate how to find the hyper-volume of an hypersphere of dimension N.</p><p>The <a href="http://mathreference.com/ca-int,hsp.html" target="_blank" rel="noopener">Math Reference Project</a> gives a short &amp; sweet demonstration.&nbsp; I personally found it hard to follow.&nbsp; <a href="http://www.cs.cornell.edu/jeh/book11April2014.pdf">Foundations of Data Science by John Hopcroft &amp; Ravindran Kannan</a> (chapter 2) starts a demonstration but does cut short.</p><p>
I wanted to contribute a complete demonstration because I just love that type of mathematical problem.&nbsp; It’s one of my many flaws.</p><h2>Approach</h2><p><img width="320" height="149" align="left" style="margin:0 10px 0 0;border:0 currentcolor;border-image:none;float:left;display:inline;background-image:none;" alt="countryside, grass, grassland" src="https://images.pexels.com/photos/24580/pexels-photo-24580.jpg?w=1260&amp;h=750&amp;auto=compress&amp;cs=tinysrgb" border="0" />We’ll use the Cartesian coordinates and the fact that the volume of an hypersphere of dimension <em>N</em> can be found by integrating the volume of an hypersphere of dimension <em>N-1</em> with an infinitesimal thickness:</p><p align="center">$latex V_N(R) = \displaystyle\int_{-R}^R V_{N-1}(\sqrt{R^2-x^2}) dx$</p>
<p><a href="/assets/posts/2017/3/hypersphere-volume/image2.png"><img width="320" height="307" title="image" align="right" style="border:0 currentcolor;border-image:none;margin-right:0;margin-left:0;float:right;display:inline;background-image:none;" alt="image" src="/assets/posts/2017/3/hypersphere-volume/image_thumb2.png" border="0" /></a>We’ll find the volume for a few dimensions then we’ll generalize the result.</p>
<h3>N=1</h3>
<p>Well, $latex V_1(R) = 2 R$:&nbsp; it’s a line.</p>
<h3>N=2</h3>
<p>We already know the result should be $latex V_2(R) = \pi R^2$, but let’s demonstrate it.</p>
<p align="center">$latex \begin{array}{lcl} V_2(R) &amp;=&amp; \displaystyle\int_{-R}^R V_1(\sqrt{R^2-x^2}) dx\\ &amp;=&amp; \displaystyle\int_{-R}^R 2 \sqrt{R^2-x^2} dx\\&amp;=&amp; 2 R^2 \displaystyle\int_{-R}^R \sqrt{1- (\frac {x}{R})^2} d \frac{x}{R}\\&amp;=&amp; 2 R^2 \displaystyle\int_{-\pi/2}^{\pi/2} \sqrt{1- \sin^2 \theta} \, d (\sin \theta) \text{ where } \sin \theta = \frac{x}{R}\\&amp;=&amp; 2 R^2 \displaystyle\int_{-\pi/2}^{\pi/2} \cos^2 \theta \, d \theta\\&amp;=&amp; 2 R^2 \cdot \frac{1}{2} [ \theta + \sin {2 \theta} ]_{-\pi/2}^{\pi/2}\\ &amp;=&amp; \pi R^2\end{array}$</p>
<h3>N=3</h3>
<p>We know the result should be $latex V_3(R) = \frac{4}{3} \pi R^3$, but again, let’s demonstrate it.</p>
<p align="center">$latex \begin{array}{rcl}V_3(R) &amp;=&amp; \displaystyle\int_{-R}^R V_2(\sqrt{R^2-x^2}) dx\\&amp;=&amp; \displaystyle\int_{-R}^R \pi (\sqrt{R^2-x^2})^2 dx\\&amp;=&amp; \pi (2 R^3 - \displaystyle\int_{-R}^R x^2 dx)\\&amp;=&amp; \pi (2 R^3 - \frac{2 R^3}{3})\\&amp;=&amp; \frac{4}{3} \pi R^3\end{array}$</p>
<h3>N=4</h3>
<p>Let’s find the hyper-volume of an hypersphere of dimension 4.</p>
<p align="center">$latex \begin{array}{rcl} V_4(R) &amp;=&amp; \displaystyle\int_{-R}^R V_3(\sqrt{R^2-x^2}) dx\\&amp;=&amp; \displaystyle\int_{-R}^R \frac{4}{3} \pi (\sqrt{R^2-x^2})^3 dx\\&amp;=&amp; \frac{4}{3} \pi R^4 \displaystyle\int_{-R}^R (1-(\frac{x}{R})^2)^\frac{3}{2} d(\frac{x}{R})\\&amp;=&amp; \frac{4}{3} \pi R^4 \displaystyle\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}} (1-\sin^2 \theta)^\frac{3}{2} d(\sin \theta) \text{ where } \sin \theta = \frac{x}{R}\\&amp;=&amp; \frac{4}{3} \pi R^4 \displaystyle\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}} \cos^3 \theta \cdot \cos \theta d \theta\\&amp;=&amp; \frac{4}{3} \pi R^4 \displaystyle\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}} \cos^4 \theta d \theta\\&amp;=&amp; \frac{4}{3} \pi R^4 ([\frac{\cos^3 \theta \sin \theta}{4}]_{-\frac{\pi}{2}}^{\frac{\pi}{2}} + \frac{3}{4} \displaystyle\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}} \cos^2 \theta d \theta)\\&amp;=&amp; \frac{4}{3} \pi R^4 (0 + \frac{3}{4} \frac{1}{2} [\theta + \sin 2 \theta]_{-\frac{\pi}{2}}^{\frac{\pi}{2}})\\&amp;=&amp; \frac{\pi^2}{2} R^4\end{array}$</p>
<h3>Generalization</h3>
<p>Now we have quite some practice.&nbsp; Let’s try to generalize the hypersphere volume formula.</p>
<p>First let’s assume the volume formula has the following form:</p>
<p align="center">$latex V_N(R) = K_N R^N$</p>
<p>Where $latex K_N$ is a constant (independent of <em>R</em>).&nbsp; We’ll see that we only need to assume that form for the volumes of <em>N-1</em> and less.&nbsp; Since we already know it to be true for <em>N &lt;= 4</em>, it isn’t a strong assumption.</p>
<p>With that, let’s proceed:</p>
<p align="center">$latex \begin{array}{rcl} V_N(R) &amp;=&amp; \displaystyle\int_{-R}^R V_{N-1}(\sqrt{R^2-x^2}) dx\\&amp;=&amp; K_{N-1} \displaystyle\int_{-R}^R (R^2-x^2)^\frac{N-1}{2} dx\\&amp;=&amp; K_{N-1} R^N \displaystyle\int_{-R}^R (1-(\frac{x}{R})^2)^\frac{N-1}{2} d(\frac{x}{R})\\&amp;=&amp; K_{N-1} R^N \displaystyle\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}} \cos^{N-1} \theta \cdot \cos \theta d \theta \text{ where } \sin \theta = \frac{x}{R}\\&amp;=&amp; K_{N-1} R^N \displaystyle\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}} \cos^N \theta d \theta\end{array}$</p>
<p align="left">We’re dealing with a recursion here, so let’s rewrite this equation in terms of two sets of constants:</p>
<p align="center">$latex \begin{array}{rcl}V_N(R) &amp;=&amp; K_N R^N = C_N K_{N-1} R^N \text{ where } C_N = \displaystyle\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}} \cos^N \theta d \theta\\&amp;\implies&amp; K_N = C_N K_{N-1}\\&amp;\implies&amp; K_N = (\displaystyle\prod_{i=2}^N C_i) K_1 = 2 \displaystyle\prod_{i=2}^N C_i \text{ (since }K_1=2 \text{)}\end{array}$</p>
<p align="left">Let’s work on the set of constants <em>C</em>.&nbsp; We know the first couple of values:</p><p align="center">$latex \begin{array}{rcl} C_0 &amp;=&amp; \pi \\ C_1 &amp;=&amp; 2 \\ C_2 &amp;=&amp; \frac{\pi}{2} \end{array}$</p><p align="left">We can also obtain a recursive expression.</p>
<p align="center">$latex C_N = \displaystyle\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}} \cos^N \theta d \theta = \frac{N-1}{N} \displaystyle\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}} \cos^{N-2} \theta d \theta \implies C_N = \frac{N-1}{N} C_{N-2} $</p>
<p align="left">If we observes that</p><p align="center">$latex \begin{array}{rcl} C_N C_{N-1} &amp;=&amp; \frac{N-1}{N} C_{N-2} \frac{N-2}{N-1} C_{N-3}\\&amp;=&amp; \frac{N-2}{N} C_{N-2} C_{N-3}\\&amp;=&amp; \frac{N-2}{N} \frac{N-4}{N-2} C_{N-4} C_{N-5}\\&amp;=&amp; \frac{N-4}{N} C_{N-4} C_{N-5}\\&amp;=&amp;\begin{cases} \frac{2}{N} C_2 C_1 &amp; \text{if N is even} \\ \frac{1}{N} C_1 C_0 &amp; \text{if N is odd} \end{cases}\\&amp;=&amp;\begin{cases} \frac{2 \pi}{N} &amp; \text{if N is even} \\ \frac{2 \pi}{N} &amp; \text{if N is odd} \end{cases}\\&amp;=&amp;\frac{2 \pi}{N}\end{array}$</p><p align="left"></p><p align="left"></p><p align="left">Then we can write</p>
<p align="center">$latex \begin{array}{lcl} K_N &amp;=&amp; 2 \displaystyle\prod_{i=2}^N C_i \\ &amp;=&amp; \begin{cases} 2 \cdot \frac{2 \pi}{N} \frac{2 \pi}{N-2} \dots \frac{2 \pi}{4} C_2 &amp; \text{if N is even} \\ 2 \cdot \frac{2 \pi}{N} \frac{2 \pi}{N-2} \dots \frac{2 \pi}{3} &amp; \text{if N is odd} \end{cases}\\ &amp;=&amp; \begin{cases} \pi \cdot \frac{2 \pi}{N} \frac{2 \pi}{N-2} \dots \frac{2 \pi}{4} &amp; \text{if N is even} \\ 2 \cdot \frac{2 \pi}{N} \frac{2 \pi}{N-2} \dots \frac{2 \pi}{3} &amp; \text{if N is odd} \end{cases}\end{array}$</p><p align="left">Therefore we found that </p><p align="center">$latex \begin{array}{lcl} V_N (R) &amp;=&amp; \begin{cases} \pi \cdot \frac{2 \pi}{N} \frac{2 \pi}{N-2} \dots \frac{2 \pi}{4} \cdot R^N &amp; \text{if N is even} \\ 2 \cdot \frac{2 \pi}{N} \frac{2 \pi}{N-2} \dots \frac{2 \pi}{3} \cdot R^N &amp; \text{if N is odd} \end{cases}\end{array}$</p><p align="left">Which gives us an explicit formula for the volume of an hypersphere in <em>N</em> dimensions.</p><h2 align="left">Limit</h2><p align="left">Given the formula for $latex K_N \text{ (and that } V_N(R) =K_N R^N$, it is easy to it is a product of smaller and smaller terms.</p><p align="left">As soon as <em>N</em> becomes bigger than $latex 2 \pi$ (i.e. at <em>N=6</em>), the terms becomes smaller than 1 and therefore the products start to shrink.</p><p align="left">This is why the hyper volume vanishes as <em>N</em> grows towards infinity.</p><h2 align="left">Values</h2><p align="left">We can then compute values (for R=1):</p>

<table width="524" border="3">


<thead>

<tr style="background:lightblue;">

<th>Dimension</th>

<th>Formula</th>

<th>Value</th>

</tr>

</thead>



<tbody>

<tr>
<td>1</td>
<td width="117">2</td>
<td>2</td></tr>
<tr>
<td>2</td>
<td>$latex \pi$</td>
<td>3.141592654</td></tr>
<tr>
<td>3</td>
<td>$latex \frac{4 \pi}{3}$</td>
<td>4.188790205</td></tr>
<tr>
<td>4</td>
<td>$latex \pi \cdot \frac{2 \pi}{4}=\frac{\pi^2}{2}$</td>
<td><p>4.934802201</p></td></tr>
<tr>
<td>5</td>
<td>$latex 2 \cdot \frac{2 \pi}{5} \frac{2 \pi}{3}=\frac{8 \pi^2}{15}$</td>
<td><p>5.263789014</p></td></tr>
<tr>
<td>6</td>
<td>$latex \pi \cdot \frac{2 \pi}{6} \frac{2 \pi}{4}= \frac{\pi^3}{6}$</td>
<td>5.16771278</td></tr>


</tbody>
</table>

<p align="left"><br /></p><p align="left">which corresponds to what we gave in <a href="https://vincentlauzon.com/2017/06/21/hyperspheres-the-curse-of-dimensionality/">our last article</a>.</p>
<h2 align="left">Summary</h2><p align="left">We demonstrated how to find the hyper volume of an hyper sphere of dimension <em>N</em> and could rigorously find that the hyper volume vanishes as the dimension grows.</p><p align="left">That result is counterintuitive and this is why we thought a mathematical proof was warranted.</p><p align="left"></p>