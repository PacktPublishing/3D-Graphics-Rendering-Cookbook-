//
#version 460

#extension GL_EXT_nonuniform_qualifier : require

#include <data/shaders/chapter07/VK01.h>
#include <data/shaders/chapter07/VK01_VertCommon.h>
#include <data/shaders/chapter07/AlphaTest.h>

layout(location = 0) in vec3 uvw;
layout(location = 1) in vec3 v_worldNormal;
layout(location = 2) in vec4 v_worldPos;
layout(location = 3) in flat uint matIdx;

layout(location = 0) out vec4 outColor;

// Buffer with PBR material coefficients
layout(binding = 4) readonly buffer MatBO  { MaterialData data[]; } mat_bo;

layout(binding = 6) uniform samplerCube texEnvMap;
layout(binding = 7) uniform samplerCube texEnvMapIrradiance;
layout(binding = 8) uniform sampler2D   texBRDF_LUT;
///layout(binding = 13) uniform sampler2D texMetalRoughness;

// All 2D textures for all of the materials
layout(binding = 9) uniform sampler2D textures[];

#include <data/shaders/chapter06/PBR.sp>

void main()
{
	MaterialData md = mat_bo.data[matIdx];

	vec4 emission = vec4(0,0,0,0); // md.emissiveColor_;
	vec4 albedo = md.albedoColor_;
	vec3 normalSample = vec3(0.0, 0.0, 0.0);

	// fetch albedo
	if (md.albedoMap_ < 2000)
	{
		uint texIdx = uint(md.albedoMap_);
		albedo = texture(textures[nonuniformEXT(texIdx)], uvw.xy);
	}
	// TODO: check invalid texture handling
	if (md.normalMap_ < 2000)
	{
		uint texIdx = uint(md.normalMap_);
		normalSample = texture(textures[nonuniformEXT(texIdx)], uvw.xy).xyz;
	}

	runAlphaTest(albedo.a, md.alphaTest_);

	// world-space normal
	vec3 n = normalize(v_worldNormal);

	// normal mapping: skip missing normal maps
	if (length(normalSample) > 0.5)
        {
                n = perturbNormal(n, normalize(ubo.cameraPos.xyz - v_worldPos.xyz), normalSample, uvw.xy);
        }

	vec3 lightDir = normalize(vec3(-1.0, 1.0, 0.1));

	float NdotL = clamp( dot( n, lightDir ), 0.0, 1.0 );

//	outColor = vec4( NdotL * vec3(1, 0, 0), 1.0 );
	outColor = vec4( albedo.rgb * NdotL + emission.rgb, 1.0 );
//	outColor = vec4( .5 * (normalize(v_worldNormal) + vec3(1.)), 1.0 );
//	outColor = vec4( n, 1.0 );
//	outColor = vec4( normalSample, 1.0 );
}
