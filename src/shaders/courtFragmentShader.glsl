uniform vec3 innerColor;
uniform vec3 outterColor;
varying vec2 vUv;

void main()
{
    float strength = 1.0 - step(0.01, abs(distance(vUv, vec2(0.5)) - 0.25));
    
    
    
    gl_FragColor = vec4(vec3(strength), 1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
}