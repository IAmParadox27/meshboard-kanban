using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace Meshboard.Api.Conventions
{
    public sealed class ApiRoutePrefixConvention : IApplicationModelConvention
    {
        private readonly AttributeRouteModel m_routePrefix;

        public ApiRoutePrefixConvention(string prefix)
        {
            m_routePrefix = new AttributeRouteModel(new RouteAttribute(prefix));
        }

        public void Apply(ApplicationModel application)
        {
            foreach (ControllerModel controller in application.Controllers)
            {
                foreach (SelectorModel selector in controller.Selectors)
                {
                    if (selector.AttributeRouteModel is null)
                    {
                        selector.AttributeRouteModel = m_routePrefix;
                    }
                    else
                    {
                        selector.AttributeRouteModel = AttributeRouteModel.CombineAttributeRouteModel(
                            m_routePrefix,
                            selector.AttributeRouteModel
                        );
                    }
                }
            }
        }
    }
}